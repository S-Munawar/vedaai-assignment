import type { Request, Response } from 'express';
import { createSchoolRequestSchema, schoolIdSchema } from '@repo/shared/schools';
import { env } from '@/config/env';
import { SchoolModel } from '@/models/school.model';

function normalizeSchoolName(schoolName: string): string {
  return schoolName.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapSchool(school: {
  _id: { toString(): string };
  name: string;
  board: string;
  medium: string;
  schoolType: string;
  location?: {
    addressLine?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  } | null;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  principalName?: string;
  establishedYear?: number | null;
  description?: string;
  isActive?: boolean;
}) {
  return {
    id: school._id.toString(),
    name: school.name,
    board: school.board,
    medium: school.medium,
    schoolType: school.schoolType,
    location: {
      addressLine: school.location?.addressLine || '',
      city: school.location?.city || '',
      state: school.location?.state || '',
      country: school.location?.country || '',
      postalCode: school.location?.postalCode || '',
    },
    contactEmail: school.contactEmail || '',
    contactPhone: school.contactPhone || '',
    website: school.website || '',
    principalName: school.principalName || '',
    establishedYear: school.establishedYear ?? null,
    description: school.description || '',
    isActive: school.isActive ?? true,
  };
}

export async function listSchools(req: Request, res: Response) {
  try {
    const adminKey = req.headers['x-admin-key'];
    const isAdminRequest = adminKey === env.adminApiKey;

    const schools = await SchoolModel.find(isAdminRequest ? {} : { isActive: { $ne: false } })
      .sort({ name: 1 })
      .select(
        '_id name board medium schoolType location contactEmail contactPhone website principalName establishedYear description isActive',
      );

    return res.json({
      success: true,
      schools: schools.map((school) => mapSchool(school)),
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
      board: parsed.data.board,
      medium: parsed.data.medium,
      schoolType: parsed.data.schoolType,
      location: parsed.data.location,
      contactEmail: parsed.data.contactEmail,
      contactPhone: parsed.data.contactPhone,
      website: parsed.data.website,
      principalName: parsed.data.principalName,
      establishedYear: parsed.data.establishedYear,
      description: parsed.data.description,
      isActive: parsed.data.isActive,
    });

    return res.status(201).json({
      success: true,
      school: mapSchool(school),
    });
  } catch (error) {
    console.error('❌ Error creating school:', error);
    return res.status(500).json({ success: false, error: 'Failed to create school' });
  }
}

export async function getSchoolById(req: Request, res: Response) {
  try {
    const adminKey = req.headers['x-admin-key'];
    const isAdminRequest = adminKey === env.adminApiKey;

    const parsedSchoolId = schoolIdSchema.safeParse(req.params.schoolId);

    if (!parsedSchoolId.success) {
      return res.status(400).json({ success: false, error: 'Invalid school id' });
    }

    const school = await SchoolModel.findOne({
      _id: parsedSchoolId.data,
      ...(isAdminRequest ? {} : { isActive: { $ne: false } }),
    }).select(
      '_id name board medium schoolType location contactEmail contactPhone website principalName establishedYear description isActive',
    );

    if (!school) {
      return res.status(404).json({ success: false, error: 'School not found' });
    }

    return res.json({
      success: true,
      school: mapSchool(school),
    });
  } catch (error) {
    console.error('❌ Error fetching school by id:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch school details' });
  }
}
