import { pool } from "@/app/db";


function generateHourlyTimestamps(start, end) {
  const result = [];
  const current = new Date(start);
  current.setMinutes(0, 0, 0); 

  const endTime = new Date(end);

  while (current <= endTime) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const date = String(current.getDate()).padStart(2, '0');
    const hour = String(current.getHours()).padStart(2, '0');

    result.push(`${year}-${month}-${date} ${hour}:00:00`);
    current.setHours(current.getHours() + 1);
  }

  return result;
}


export async function fetchTotalZonesHourlyData(start, end) {
    const [rows] = await pool.query(
      `
      SELECT 
        hour,
        SUM(ROUND(kVAh_difference,1)) AS total_consumption
      FROM (
        SELECT
          DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') AS hour,
          energy_meter_id,
          MAX(kVAh) - MIN(kVAh) AS kVAh_difference
        FROM modbus_data
        WHERE timestamp BETWEEN ? AND ?
          AND energy_meter_id BETWEEN 1 AND 11
        GROUP BY energy_meter_id, hour
      ) AS hourly_meter_data
      GROUP BY hour
      ORDER BY hour
      `,
      [start, end]
    );
  
    const allHours = generateHourlyTimestamps(start, end);

  
    const result = allHours.map(hour => {
      const row = rows.find(r => r.hour === hour);
      return {
        hour,
        total_consumption: row ? row.total_consumption : "N/A"
      };
    });
  
    return result;
  }
  
 export async function fetchTotalZonesDailyData(start, end) {
    const [rows] = await pool.query(
      `
      SELECT 
      day,
      SUM(ROUND(daily_meter_consumption, 1)) AS total_daily_consumption
    FROM (
      SELECT
        DATE(timestamp) AS day,
        energy_meter_id,
        MAX(kVAh) - MIN(kVAh) AS daily_meter_consumption
      FROM modbus_data
      WHERE timestamp BETWEEN ? AND ?
        AND energy_meter_id BETWEEN 1 AND 11
      GROUP BY energy_meter_id, day
    ) AS meter_daily_consumption
    GROUP BY day
    ORDER BY day
      `,
      [start, end]
    );
    return rows;
  } 
  

  
   