import type { Request, Response } from 'express';
import { createSchoolRequestSchema } from '@repo/shared/schools';
import { env } from '@/config/env';
import { SchoolModel } from '@/models/school.model';

function normalizeSchoolName(schoolName: string): string {
  return schoolName.trim().toLowerCase().replace(/\s+/g, ' ');
}

export async function listSchools(_req: Request, res: Response) {
  try {
    const schools = await SchoolModel.find({})
      .sort({ name: 1 })
      .select('_id name');

    return res.json({
      success: true,
      schools: schools.map((school) => ({
        id: school._id.toString(),
        name: school.name,
      })),
    });
  } catch (error) {
    console.error('❌ Error listing schools:', error);
    return res.status(500).json({ success: false, error: 'Failed to list schools' });
  }
}

export async function createSchool(req: Request, res: Response) {
  try {
    const adminKey = req.headers['x-admin-key'];

    if (adminKey !== env.adminApiKey) {
      return res.status(401).json({ success: false, error: 'Invalid admin key' });
    }

    const parsed = createSchoolRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid body' });
    }

    const normalizedName = normalizeSchoolName(parsed.data.name);
    const existing = await SchoolModel.findOne({ normalizedName }).select('_id name');

    if (existing) {
      return res.status(400).json({ success: false, error: 'School already exists' });
    }

    const school = await SchoolModel.create({
      name: parsed.data.name.trim(),
      normalizedName,
    });

    return res.status(201).json({
      success: true,
      school: {
        id: school._id.toString(),
        name: school.name,
      },
    });
  } catch (error) {
    console.error('❌ Error creating school:', error);
    return res.status(500).json({ success: false, error: 'Failed to create school' });
  }
}
