import { NextResponse } from 'next/server';
import { query } from '../../db'; 

export async function GET() {
  const CLIENT_ID_TO_FETCH = 1; 

  try {
    const clientDetailsRows = await query(
      'SELECT last_record_timestamp FROM clientOtherDetails WHERE id = ?',
      [CLIENT_ID_TO_FETCH]
    );

    if (clientDetailsRows.length > 0) {
      return NextResponse.json(clientDetailsRows[0]);
    } else {
      return NextResponse.json({ message: 'Client with ID 1 not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ error: 'Failed to fetch client details' }, { status: 500 });
  }
}