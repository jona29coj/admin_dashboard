import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const ENCRYPTION_KEY = '9cF7Gk2MZpQ8XvT5LbR3NdYqWjK6HsA4'; 

function decrypt(encryptedText) {
  try {
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

export async function GET() {
  const cookieStore = cookies();
  const authCookie = cookieStore.get('authData');

  if (!authCookie) {
    return NextResponse.json({ message: 'No cookie' }, { status: 401 });
  }

  const decrypted = decrypt(authCookie.value);

  if (!decrypted) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const parsed = JSON.parse(decrypted);

  if (parsed.auth !== 'true') {
    return NextResponse.json({ message: 'Auth false' }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    username: parsed.username,
    deviceName: parsed.deviceName,
    ipAddress: parsed.ipAddress,
  });
}
