import { NextResponse } from "next/server";
import { pgQuery } from "@/app/dbpg";
import moment from "moment-timezone";

// GET: Fetch overall attendance history (all users)
export async function GET() {
  try {
    const result = await pgQuery(
      `SELECT id, username, check_in, check_out, work_hours, status
       FROM attendance
       ORDER BY date(check_in) DESC, username ASC`
    );

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
        username: record.username,
        date,
        check_in: record.check_in,
        check_out: record.check_out,
        work_hours: workHours,
        status: record.status,
      };
    });

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error("Overall Attendance API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
