import { NextResponse } from "next/server";
import { pgQuery } from "@/app/dbpg";
import moment from "moment-timezone";

// GET: Fetch today's predictions along with actual consumption from endpoint
export async function GET(req) {
  try {
    const today = moment.tz("Asia/Kolkata").format("YYYY-MM-DD");

    // --- Fetch predictions from DB ---
    const predResult = await pgQuery(
      `SELECT date, hour, predicted_kvah
       FROM prediction
       WHERE date = $1
       ORDER BY hour`,
      [today]
    );

    const predictions = predResult.map((row) => ({
      date: row.date,
      hour:
        typeof row.hour === "number"
          ? String(row.hour).padStart(2, "0") + ":00"
          : String(row.hour).slice(0, 5),
      predicted_kvah: row.predicted_kvah,
    }));

    // --- Fetch actuals from API (instead of DB) ---
    const startDateTime = `${today}+00:00`;
    const endDateTime = `${today}+23:00`;

    const apiRes = await fetch(
      `https://mw.elementsenergies.com/api/hkVAhconsumption?startDateTime=${startDateTime}&endDateTime=${endDateTime}`
    );

    if (!apiRes.ok) {
      throw new Error(`Failed to fetch actuals: ${apiRes.statusText}`);
    }

    const apiData = await apiRes.json();

    // ✅ Parse object response correctly
    const actuals = Object.entries(apiData.consumptionData || {}).map(
      ([ts, kvah]) => ({
        date: moment.tz(ts, "Asia/Kolkata").format("YYYY-MM-DD"),
        hour: moment.tz(ts, "Asia/Kolkata").format("HH:00"),
        actual_kvah: parseFloat(kvah),
      })
    );

    return NextResponse.json({ predictions, actuals });
  } catch (error) {
    console.error("Predict API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
