import { NextResponse } from "next/server";
import { pgQuery } from "@/app/dbpg";
import moment from "moment-timezone";

// GET: Fetch prediction and actual consumption for a specific date
export async function GET(req) {
  try {
    const date = req.nextUrl.searchParams.get("date");
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const parsedDate = moment.tz(date, "Asia/Kolkata");
    if (!parsedDate.isValid()) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // --- Fetch predictions ---
    const predResult = await pgQuery(
      `SELECT date, hour, predicted_kvah
       FROM prediction
       WHERE date = $1
       ORDER BY hour`,
      [date]
    );

    const predictions = predResult.map((row) => ({
      date: row.date,
      hour:
        typeof row.hour === "number"
          ? String(row.hour).padStart(2, "0") + ":00"
          : String(row.hour).slice(0, 5),
      predicted_kvah: row.predicted_kvah,
    }));

    // --- Fetch actual consumption ---
    const consResult = await pgQuery(
      `SELECT date, hour, kvah
       FROM consumption_data
       WHERE date = $1
       ORDER BY hour`,
      [date]
    );

    const actuals = consResult.map((row) => ({
      date: row.date,
      hour: row.hour.slice(0, 5), // "HH:MM"
      actual_kvah: parseFloat(row.kvah),
    }));

    return NextResponse.json({ predictions, actuals });
  } catch (error) {
    console.error("Predict History API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
