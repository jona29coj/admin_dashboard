import { NextResponse } from "next/server";
import { pgQuery } from "@/app/dbpg";
import moment from "moment-timezone";
import { getUserFromRequest } from "@/app/api/auth/utils";

// ✅ Only these users are allowed
const ALLOWED_USERS = ["Auna Sando", "Anson Sando"];

export async function GET(req) {
  try {
    // 1️⃣ Get the authenticated user
    const user = await getUserFromRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Restrict access by username
    if (!ALLOWED_USERS.includes(user.username)) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // 3️⃣ Extract `month` from URL (e.g., "2025-11"), fallback to current month
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || moment().format("YYYY-MM");

    // 4️⃣ Build query: match records where check_in or date falls in that month
    const query = `
      SELECT id, username, check_in, check_out, work_hours, status, work_update
      FROM attendance
      WHERE (
        TO_CHAR(check_in, 'YYYY-MM') = '${month}'
        OR TO_CHAR(date(check_out), 'YYYY-MM') = '${month}'
      )
      ORDER BY date(check_in) DESC, username ASC
    `;

    // 5️⃣ Execute query
    const result = await pgQuery(query);

    // 6️⃣ Format response
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
        work_update: record.work_update || "-",
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