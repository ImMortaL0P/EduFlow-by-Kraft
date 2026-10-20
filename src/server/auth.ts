import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "trajectx-secret-key-kraft-coaching-2026";
const LEGACY_JWT_SECRET = "eduflow-secret-key-kraft-coaching-2026";

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
  roles?: string[];
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    let decoded: { sub: string; email: string; full_name?: string } | null = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; full_name?: string };
    } catch {
      decoded = jwt.verify(token, LEGACY_JWT_SECRET) as { sub: string; email: string; full_name?: string };
    }
    return {
      id: decoded.sub,
      email: decoded.email,
      full_name: decoded.full_name,
      user_metadata: { full_name: decoded.full_name },
    };
  } catch (err) {
    return null;
  }
}
