import { NextResponse } from 'next/server';
import { pgQuery } from '@/app/dbaspg';
import moment from 'moment-timezone';

export async function GET() {
  try {
    const now = moment().tz('Asia/Kolkata');

    const rows = await pgQuery(`
      SELECT last_active
      FROM user_sessions
      ORDER BY last_active DESC
    `);

    const activeCount = rows.filter(session => {
      if (!session.last_active) return false;

      const lastActive = moment
        .tz(session.last_active, 'Asia/Kolkata');

      const diffInMinutes = now.diff(lastActive, 'minutes');
      return diffInMinutes <= 1;
    }).length;

    return NextResponse.json({ activeSessions: activeCount });

  } catch (err) {
    console.error('Error counting active sessions:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}