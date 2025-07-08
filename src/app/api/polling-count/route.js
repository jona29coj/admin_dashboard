import { NextResponse } from "next/server";
import { query } from '../../db'; 

export async function GET() {
  try {
    const rows = await query(`
      SELECT 
        energy_meter_id AS slaveId,
        COUNT(*) AS actual
      FROM modbus_data
      WHERE DATE(timestamp) = CURDATE() - INTERVAL 3 DAY AND
      energy_meter_id BETWEEN 1 AND 11
      GROUP BY energy_meter_id
      ORDER BY energy_meter_id
    `);

    const result = rows.map(row => ({
      slaveId: row.slaveId,
      actual: row.actual,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in polling-count:", error);
    return NextResponse.json(
      { error: "Failed to fetch polling count data" },
      { status: 500 }
    );
  }
}
