import { NextResponse } from 'next/server';
import { query } from '@/app/db';

export async function GET() {
  try {
    const rows = await query('SELECT * FROM clients ORDER BY id DESC');
    return NextResponse.json(rows);
  } catch (err) {
    console.error('GET /clients error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
        customer_name,
        phase,
        type,
        likely_to_close,
        remarks,
        last_touchpoint,
        action_required,
    } = body;

    const result = await query(
      `INSERT INTO clients (customer_name, phase, type, likely_to_close, remarks, last_touchpoint, action_required)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name ?? "",
        phase ?? "",
        type ?? "",
        likely_to_close ?? "",
        remarks ?? "",
        last_touchpoint ?? "",
        action_required ?? "",
      ]
    );

    return NextResponse.json({ id: result.insertId, ...body });
  } catch (err) {
    console.error('POST /clients error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req) {
    try {
      const body = await req.json();
      const {
        id,
        customer_name,
        phase,
        type,
        likely_to_close,
        remarks,
        last_touchpoint,
        action_required,
      } = body;
  
      if (!id) {
        return NextResponse.json({ error: 'Missing ID for update' }, { status: 400 });
      }
  
      const values = [
        customer_name ?? "",
        phase ?? "",
        type ?? "",
        likely_to_close ?? "",
        remarks ?? "",
        last_touchpoint ?? "",
        action_required ?? "",
        id,
      ];
  
      await query(
        `UPDATE clients
         SET customer_name = ?, phase = ?, type = ?, likely_to_close = ?, remarks = ?, last_touchpoint = ?, action_required = ?
         WHERE id = ?`,
        values
      );
  
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('PUT /clients error:', err);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  
