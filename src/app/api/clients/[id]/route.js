import { NextResponse } from "next/server";
import { query } from "@/app/db";

const formatDateForMySQL = (dateString) => {
  if (!dateString) return null;
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`; // ✅ Local yyyy-mm-dd, no UTC conversion
};


// GET
export async function GET(req, context) {
  const { id } = await context.params;
  console.log("🔍 GET request for client ID:", id);
  
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }
  try {
    const sql = "SELECT * FROM clientDetails WHERE client_id = ? ORDER BY id ASC";
    const result = await query(sql, [parseInt(id)]);
    console.log("📊 GET result:", result);
    return NextResponse.json(result || []);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// PUT
export async function PUT(req, context) {
  const { id } = await context.params;
  console.log("📝 PUT request for client ID:", id);
  
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    console.log("📝 PUT request body:", body);
    
    const {
      id: detailId,
      interaction_date,
      interaction_type,
      members,
      minutes_of_meeting,
      action_required,
      follow_up_date,
    } = body;

    console.log("📝 Extracted detail ID:", detailId);
    console.log("📝 Client ID from URL:", id);

    if (!detailId || isNaN(parseInt(detailId))) {
      console.log("❌ Missing or invalid detail ID");
      return NextResponse.json({ error: "Missing or invalid interaction id" }, { status: 400 });
    }

    // Check if the detail exists and belongs to the client
    const checkSql = "SELECT id FROM clientDetails WHERE id = ? AND client_id = ?";
    console.log("🔍 Checking existence with query:", checkSql);
    console.log("🔍 Check parameters:", [parseInt(detailId), parseInt(id)]);
    
    const checkResult = await query(checkSql, [parseInt(detailId), parseInt(id)]);
    console.log("🔍 Check result:", checkResult);
    
    if (!checkResult || checkResult.length === 0) {
      console.log("❌ Record not found or doesn't belong to client");
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
    
    console.log("📝 UPDATE SQL:", sql);
    console.log("📝 UPDATE values:", values);
    
    const result = await query(sql, values);
    console.log("📝 UPDATE result:", result);

    if (result.affectedRows === 0) {
      console.log("❌ No rows were updated");
      return NextResponse.json({ error: "No rows updated. Record may not exist." }, { status: 404 });
    }
    
    console.log("✅ UPDATE successful, affected rows:", result.affectedRows);
    return NextResponse.json({ success: true, message: "Interaction updated successfully" });
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

// POST
export async function POST(req, context) {
  const { id } = await context.params;
  console.log("➕ POST request for client ID:", id);
  
  if (!id || isNaN(parseInt(id))) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }
  try {
    const body = await req.json();
    console.log("➕ POST request body:", body);
    
    const {
      interaction_date,
      interaction_type,
      members,
      minutes_of_meeting,
      action_required,
      follow_up_date,
    } = body;

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
    
    console.log("➕ INSERT values:", values);
    const result = await query(sql, values);
    console.log("➕ INSERT result:", result);

    return NextResponse.json({ success: true, message: "Interaction created successfully", id: result.insertId });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    console.log("🗑️ DELETE request for detail ID:", id);
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const result = await query('DELETE FROM clientDetails WHERE id = ?', [id]);
    console.log("🗑️ DELETE result:", result);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /clients/[id] error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}