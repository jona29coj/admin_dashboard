import { NextResponse } from 'next/server';
import { query } from '@/app/db';
import moment from 'moment-timezone';

export async function GET() {
  try {
    const [row] = await query(
      'SELECT timestamp FROM modbus_data ORDER BY timestamp DESC LIMIT 1'
    );

    if (!row || !row.timestamp) {
      return NextResponse.json([]);
    }

    const last = moment.tz(row.timestamp, 'Asia/Kolkata');
    const now = moment().tz('Asia/Kolkata');

    const minutesDiff = now.diff(last, 'minutes');

    const alerts = [];

    if (minutesDiff > 30) {
      alerts.push({
        id: 1,
        date: last.format('YYYY-MM-DD'),
        time: last.format('HH:mm'),
        alert: 'Data Missing',
        limit: 'Interval > 30 min',
        value: `${minutesDiff} min gap`
      });
    }

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
