import { NextResponse } from "next/server";
import { pgQuery } from "@/app/dbpg";
import moment from "moment-timezone";

// GET: Fetch full attendance history for a user
export async function GET(req) {
  try {
    const username = req.nextUrl.searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const result = await pgQuery(
      `SELECT id, username, check_in, check_out, work_hours, status, work_update
       FROM attendance
       WHERE username = $1
       ORDER BY date(check_in) DESC`,
      [username]
    );

    // Format records
    const formatted = result.map((record) => {
      const date = record.check_in
        ? moment(record.check_in).tz("Asia/Kolkata").format("YYYY-MM-DD")
        : null;

      let workHours = "-";
      if (record.work_hours) {
        const wh = record.work_hours;
        const h = String(wh.hours || 0).padStart(2, "0");
        const m = String(wh.minutes || 0).padStart(2, "0");
        const s = String(wh.seconds || 0).padStart(2, "0");
        workHours = `${h}:${m}:${s}`;
      }

      return {
        date,
        check_in: record.check_in,
        check_out: record.check_out,
        work_hours: workHours,
        status: record.status,
        work_update: record.work_update || "-",
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error("Attendance History API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
