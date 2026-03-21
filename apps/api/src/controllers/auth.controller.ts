import type { Request, Response } from 'express';
import {
  googleAuthRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
} from '@repo/shared/auth';
import { signAuthToken, verifyAuthToken } from '@/services/auth-token.service';
import { verifyGoogleIdToken } from '@/services/google-auth.service';
import {
  findGoogleUserByEmail,
  loginCredentialUser,
  registerCredentialUser,
  upsertGoogleUser,
} from '@/services/user-store.service';
import { buildAuthCookie, clearAuthCookie, parseCookie } from '@/utils/cookie.util';

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
    }

    const { username, password, schoolName } = parsed.data;

    const user = await registerCredentialUser({ username, password, schoolName });

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      profileImage: user.profileImage,
      schoolId: user.schoolId,
      schoolName: user.schoolName,
      provider: 'credentials',
    });

    res.setHeader('Set-Cookie', buildAuthCookie(token));
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        provider: 'credentials',
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'Username already exists' ||
        error.message === 'Selected school is not available. Please contact admin.')
    ) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
    }

    const { username, password } = parsed.data;

    const user = await loginCredentialUser({ username, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      profileImage: user.profileImage,
      schoolId: user.schoolId,
      schoolName: user.schoolName,
      provider: 'credentials',
    });

    res.setHeader('Set-Cookie', buildAuthCookie(token));
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        profileImage: user.profileImage,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        provider: 'credentials',
      },
    });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function googleAuth(req: Request, res: Response) {
  try {
    const parsed = googleAuthRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid request body' });
    }

    const { idToken, schoolName } = parsed.data;

    const verified = await verifyGoogleIdToken(idToken);
    const existingUser = await findGoogleUserByEmail(verified.email);

    if (existingUser) {
      const token = await signAuthToken({
        sub: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        profileImage: existingUser.profileImage,
        schoolId: existingUser.schoolId,
        schoolName: existingUser.schoolName,
        provider: 'google',
      });

      res.setHeader('Set-Cookie', buildAuthCookie(token));
      return res.json({
        success: true,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          profileImage: existingUser.profileImage,
          schoolId: existingUser.schoolId,
          schoolName: existingUser.schoolName,
          provider: 'google',
        },
      });
    }

    if (!schoolName) {
      return res.status(409).json({ error: 'School selection required to complete registration' });
    }

    const user = await upsertGoogleUser({
      email: verified.email,
      name: verified.name,
      schoolName,
    });

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage,
      schoolId: user.schoolId,
      schoolName: user.schoolName,
      provider: 'google',
    });

    res.setHeader('Set-Cookie', buildAuthCookie(token));
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        provider: 'google',
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Selected school is not available. Please contact admin.'
    ) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(401).json({ error: 'Google authentication failed' });
  }
}

export function logout(_req: Request, res: Response) {
  res.setHeader('Set-Cookie', clearAuthCookie());
  return res.json({ success: true });
}

export async function me(req: Request, res: Response) {
  const token = parseCookie(req.headers.cookie);

  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  const payload = await verifyAuthToken(token);

  if (!payload) {
    return res.status(401).json({ authenticated: false });
  }

  return res.json({ authenticated: true, user: payload });
}
