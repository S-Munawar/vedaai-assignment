import type { Request, Response } from 'express';
import { isValidSchoolName } from '@/models/auth.model';
import { signAuthToken, verifyAuthToken } from '@/services/auth-token.service';
import { verifyGoogleIdToken } from '@/services/google-auth.service';
import {
  loginCredentialUser,
  registerCredentialUser,
  upsertGoogleUser,
} from '@/services/user-store.service';
import { buildAuthCookie, clearAuthCookie, parseCookie } from '@/utils/cookie.util';

export async function register(req: Request, res: Response) {
  try {
    const { username, password, schoolName } = req.body as {
      username?: string;
      password?: string;
      schoolName?: string;
    };

    if (!username || !password || !schoolName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidSchoolName(schoolName)) {
      return res.status(400).json({ error: 'Invalid school name' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = registerCredentialUser({ username, password, schoolName });

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      schoolName: user.schoolName,
      provider: 'credentials',
    });

    res.setHeader('Set-Cookie', buildAuthCookie(token));
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        schoolName: user.schoolName,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Username already exists') {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { username, password, schoolName } = req.body as {
      username?: string;
      password?: string;
      schoolName?: string;
    };

    if (!username || !password || !schoolName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidSchoolName(schoolName)) {
      return res.status(400).json({ error: 'Invalid school name' });
    }

    const user = loginCredentialUser({ username, password, schoolName });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username, school name, or password' });
    }

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      schoolName: user.schoolName,
      provider: 'credentials',
    });

    res.setHeader('Set-Cookie', buildAuthCookie(token));
    return res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        schoolName: user.schoolName,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
}

export async function googleAuth(req: Request, res: Response) {
  try {
    const { idToken, schoolName } = req.body as {
      idToken?: string;
      schoolName?: string;
    };

    if (!idToken || !schoolName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidSchoolName(schoolName)) {
      return res.status(400).json({ error: 'Invalid school name' });
    }

    const verified = await verifyGoogleIdToken(idToken);
    const user = upsertGoogleUser({
      email: verified.email,
      name: verified.name,
      schoolName,
    });

    const token = await signAuthToken({
      sub: user.id,
      username: user.username,
      email: user.email,
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
        schoolName: user.schoolName,
      },
    });
  } catch {
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
