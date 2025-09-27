import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get('token'); 

  if (!tokenCookie) {
    return NextResponse.json({ message: 'No token' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, process.env.JWT_SECRET);

    if (decoded.auth !== 'true') {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      username: decoded.username,
      deviceName: decoded.deviceName,
      ipAddress: decoded.ipAddress,
    });
  } catch (err) {
    return NextResponse.json({ message: 'Token verification failed' }, { status: 401 });
  }
}
