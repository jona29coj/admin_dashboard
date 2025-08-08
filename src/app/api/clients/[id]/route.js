import { NextResponse } from "next/server";
import { query } from "@/app/db";

const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().split("T")[0];
};

// GET
export async function GET(req, context) {
  const { id } = context.params;
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }
  try {
    const sql = "SELECT * FROM clientDetails WHERE client_id = ? ORDER BY id ASC";
    const result = await query(sql, [parseInt(id)]);
    return NextResponse.json(result || []);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// PUT
export async function PUT(req, context) {
  const { id } = context.params;
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const {
      id: detailId,
      interaction_date,
      interaction_type,
      members,
      minutes_of_meeting,
      action_required,
      follow_up_date,
    } = body;

    if (!detailId || isNaN(parseInt(detailId))) {
      return NextResponse.json({ error: "Missing or invalid interaction id" }, { status: 400 });
    }
    if (!interaction_date) {
      return NextResponse.json({ error: "Interaction date is required" }, { status: 400 });
    }

    const checkSql = "SELECT id FROM clientDetails WHERE id = ? AND client_id = ?";
    const checkResult = await query(checkSql, [parseInt(detailId), parseInt(id)]);
    if (!checkResult || checkResult.length === 0) {
      return NextResponse.json({ error: "Interaction not found or does not belong to this client" }, { status: 404 });
    }

    const sql = `
      UPDATE clientDetails SET 
        interaction_date = ?,
        interaction_type = ?,
        members = ?,
        minutes_of_meeting = ?,
        action_required = ?,
        follow_up_date = ?
      WHERE id = ? AND client_id = ?
    `;
    const values = [
      formatDateForMySQL(interaction_date),
      interaction_type || "",
      members || "",
      minutes_of_meeting || "",
      action_required || "",
      formatDateForMySQL(follow_up_date),
      parseInt(detailId),
      parseInt(id),
    ];
    const result = await query(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "No rows updated. Record may not exist." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Interaction updated successfully" });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// POST
export async function POST(req, context) {
  const { id } = context.params;
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    const {
      interaction_date,
      interaction_type,
      members,
      minutes_of_meeting,
      action_required,
      follow_up_date,
    } = body;

    if (!interaction_date) {
      return NextResponse.json({ error: "Interaction date is required" }, { status: 400 });
    }

    const sql = `
      INSERT INTO clientDetails (
        client_id, 
        interaction_date, 
        interaction_type, 
        members, 
        minutes_of_meeting, 
        action_required, 
        follow_up_date
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      parseInt(id),
      formatDateForMySQL(interaction_date),
      interaction_type || "",
      members || "",
      minutes_of_meeting || "",
      action_required || "",
      formatDateForMySQL(follow_up_date),
    ];
    const result = await query(sql, values);

    return NextResponse.json({ success: true, message: "Interaction created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
