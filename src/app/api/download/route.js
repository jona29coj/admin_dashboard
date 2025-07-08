import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { fetchTotalZonesHourlyData, fetchTotalZonesDailyData, fetchCustomTimeData } from './dataFetchers';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const startDateTime = searchParams.get('startDateTime');
  const endDateTime = searchParams.get('endDateTime');
  const template = searchParams.get('template');
  const customStartHour = searchParams.get('customStartHour');
  const customEndHour = searchParams.get('customEndHour');

  try {
    let result;

    switch (template) {
      case 'hourly':
        result = await fetchTotalZonesHourlyData(startDateTime, endDateTime);
        break;
      case 'daily':
        result = await fetchTotalZonesDailyData(startDateTime, endDateTime);
        break;
      case 'custom':
        result = await fetchCustomTimeData(startDateTime, endDateTime, customStartHour, customEndHour);
        break;
      default:
        return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }

    // Generate Excel file
    const ws = XLSX.utils.json_to_sheet(result);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Create response with Excel file
    return new Response(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=Consumption_${template}_${startDateTime}_to_${endDateTime}.xlsx`
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}