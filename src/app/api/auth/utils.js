import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Extracts and verifies user info from cookies (used internally by server routes)
 */
export async function getUserFromRequest() {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('token');

  if (!tokenCookie) return null;

  try {
    const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);
    if (decoded.auth !== 'true') return null;

    return {
      username: decoded.username,
      deviceName: decoded.deviceName,
      ipAddress: decoded.ipAddress,
    };
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}