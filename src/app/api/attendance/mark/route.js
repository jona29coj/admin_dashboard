import { NextResponse } from "next/server";
import { pgQuery } from "@/app/dbpg";
import moment from "moment-timezone";

// GET: Fetch today's attendance record
export async function GET(req) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    const result = await pgQuery(
      `SELECT *
       FROM attendance
       WHERE username = $1
       AND DATE(check_in) = $2
       ORDER BY check_in DESC
       LIMIT 1`,
      [username, today]
    );

    if (result.length === 0) {
      return NextResponse.json({ data: null });
    }

    const record = result[0];

    // Format work_hours if present
    if (record.work_hours) {
      const wh = record.work_hours;
      const h = String(Math.floor(wh.hours || 0)).padStart(2, "0");
      const m = String(Math.floor(wh.minutes || 0)).padStart(2, "0");
      const s = String(Math.floor(wh.seconds || 0)).padStart(2, "0");
      record.work_hours = `${h}:${m}:${s}`;
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("Attendance GET API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Check-in or Check-out
export async function POST(req) {
  try {
    const { username, action, timestamp } = await req.json();
    const today = moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    if (action === "checkin") {
      // Prevent multiple check-ins on same day
      const existing = await pgQuery(
        `SELECT * FROM attendance
         WHERE username = $1 AND DATE(check_in) = $2`,
        [username, today]
      );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "Attendance already marked today" },
          { status: 400 }
        );
      }

      await pgQuery(
        "INSERT INTO attendance (username, check_in) VALUES ($1, $2)",
        [username, timestamp]
      );
      return NextResponse.json({ message: "Checked in successfully" });
    }

    if (action === "checkout") {
      const result = await pgQuery(
        `UPDATE attendance
         SET check_out = $1,
             work_hours = AGE($1, check_in)
         WHERE username = $2
         AND DATE(check_in) = $3
         AND check_out IS NULL
         RETURNING check_in, check_out, work_hours`,
        [timestamp, username, today]
      );

      if (result.length === 0) {
        return NextResponse.json(
          { error: "No active check-in found for today" },
          { status: 400 }
        );
      }

      const record = result[0];
      let totalTime = "00:00:00";
      if (record.work_hours) {
        const wh = record.work_hours;
        const h = String(Math.floor(wh.hours || 0)).padStart(2, "0");
        const m = String(Math.floor(wh.minutes || 0)).padStart(2, "0");
        const s = String(Math.floor(wh.seconds || 0)).padStart(2, "0");
        totalTime = `${h}:${m}:${s}`;
      }

      return NextResponse.json({
        message: "Checked out successfully",
        data: {
          ...record,
          work_hours: totalTime,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Attendance POST API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
