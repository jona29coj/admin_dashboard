"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const ClientDetails = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const nameFromQuery = searchParams.get("name");

  const [details, setDetails] = useState([]);
  const [originalDetails, setOriginalDetails] = useState([]);
  const [clientName, setClientName] = useState("Client Details");
  const [editing, setEditing] = useState({ row: null, key: null });

  const fetchDetails = async () => {
    try {
      console.log("🔄 Fetching details for client ID:", id);
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      console.log("📊 Fetched data:", data);
      const safeData = Array.isArray(data) ? data : [];
      setDetails(safeData);
      setOriginalDetails(JSON.parse(JSON.stringify(safeData))); 
    } catch (error) {
      console.error("Failed to fetch client details:", error);
    }
  };

  useEffect(() => {
    if (nameFromQuery) setClientName(nameFromQuery);
    if (id) fetchDetails();
  }, [id, nameFromQuery]);

  const handleAddRow = () => {
    // Check if there's already a pending unsaved row
    const hasPending = details.some((row) => !row.id);
    if (hasPending) return;

    const newRow = {
      client_id: parseInt(id),
      interaction_date: "",
      interaction_type: "",
      members: "",
      minutes_of_meeting: "",
      action_required: "",
      follow_up_date: "",
      // Add a temporary flag to track new rows
      _isNew: true
    };

    setDetails([...details, newRow]);
    setEditing({ row: details.length, key: "interaction_date" });
  };

  const handleChange = (e, rowIndex, key) => {
    const updated = [...details];
    updated[rowIndex][key] = e.target.value;
    setDetails(updated);
  };

  const handleBlur = () => setEditing({ row: null, key: null });

  const handleDoubleClick = (rowIndex, key) => {
    setEditing({ row: rowIndex, key });
  };

  const handleDeleteRow = async (rowId, rowIndex) => {
    // For unsaved rows (no ID), just remove from local state
    if (!rowId) {
      setDetails(details.filter((_, index) => index !== rowIndex));
      return;
    }
    
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      console.log("🗑️ Deleting row with ID:", rowId);
      const res = await fetch(`/api/clients/${rowId}`, { method: "DELETE" });
      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Delete response error:", errorData);
        throw new Error("Failed to delete client detail");
      }

      setDetails(details.filter((row) => row.id !== rowId));
      setOriginalDetails(originalDetails.filter((row) => row.id !== rowId));
      console.log("✅ Delete successful");
    } catch (err) {
      console.error("❌ DELETE error:", err);
      alert("Failed to delete the record. Please try again.");
    }
  };

  const columns = [
    { key: "interaction_date", label: "Interaction Date" },
    { key: "interaction_type", label: "Interaction Type" },
    { key: "members", label: "Members" },
    { key: "minutes_of_meeting", label: "Minutes of Meeting" },
    { key: "action_required", label: "Action Required" },
    { key: "follow_up_date", label: "Follow-up Date" },
  ];

  // Helper function to check if a row has changes
  const hasRowChanged = (currentRow, originalRow) => {
    if (!originalRow) return true; // New row
    
    return columns.some(col => {
      const currentValue = currentRow[col.key] || "";
      const originalValue = originalRow[col.key] || "";
      return currentValue !== originalValue;
    });
  };

  // Helper function to check if all required fields are filled
  const isRowComplete = (row) => {
    return columns.every(col => 
      row[col.key] !== undefined && 
      row[col.key].toString().trim() !== ""
    );
  };

  const handleApplyChanges = async () => {
    console.log("🔄 Starting apply changes...");
    
    let changesMade = false;
    const newData = [...details];
    const updatedOriginal = [...originalDetails];
    let incompleteRows = [];

    for (let i = 0; i < details.length; i++) {
      const row = details[i];
      const originalRow = originalDetails.find((r) => r.id === row.id);

      console.log(`\n--- Processing row ${i + 1} ---`);
      console.log("Current row:", row);
      console.log("Original row:", originalRow);

      // Check if row is complete
      if (!isRowComplete(row)) {
        console.log("❌ Row not complete, checking if partially filled...");
        if (Object.values(row).some((v) => v && v.toString().trim() !== "")) {
          incompleteRows.push(i + 1);
        }
        continue;
      }

      // Check if row has actual changes
      if (!hasRowChanged(row, originalRow)) {
        console.log("⏭️ No changes detected for this row, skipping");
        continue;
      }

      if (!row.id || row._isNew) {
        // Creating new record
        console.log("➕ Creating new record...");
        changesMade = true;
        try {
          // Remove the temporary flag before sending to API
          const { _isNew, ...rowData } = row;
          
          const res = await fetch(`/api/clients/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rowData),
          });
          
          console.log("POST response status:", res.status);
          
          if (!res.ok) {
            const errorData = await res.json();
            console.error("❌ POST error response:", errorData);
            throw new Error(errorData.error || "Failed to create detail");
          }
          const inserted = await res.json();
          console.log("✅ POST successful:", inserted);

          // Update the row with the new ID and remove the _isNew flag
          newData[i] = { ...rowData, id: inserted.id };
          updatedOriginal.push({ ...rowData, id: inserted.id });
        } catch (err) {
          console.error("❌ POST error:", err);
          alert(`Failed to create new record: ${err.message}`);
          return;
        }
      } else {
        // Updating existing record
        console.log("📝 Updating existing record with ID:", row.id);
        changesMade = true;
        try {
          const res = await fetch(`/api/clients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          });
          
          console.log("PUT response status:", res.status);
          
          if (!res.ok) {
            const errorData = await res.json();
            console.error("❌ PUT error response:", errorData);
            throw new Error(errorData.error || "Failed to update detail");
          }
          
          const responseData = await res.json();
          console.log("✅ PUT successful:", responseData);

          // Update the original details to reflect the new saved state
          const idx = updatedOriginal.findIndex((r) => r.id === row.id);
          if (idx > -1) {
            updatedOriginal[idx] = { ...row };
          } else {
            updatedOriginal.push({ ...row });
          }
        } catch (err) {
          console.error("❌ PUT error:", err);
          alert(`Failed to update record: ${err.message}`);
          return;
        }
      }
    }

    if (incompleteRows.length > 0) {
      alert(`Please complete all fields in row(s): ${incompleteRows.join(", ")}`);
      return;
    }

    if (changesMade) {
      alert("Changes applied successfully!");
      console.log("✅ All changes applied successfully");
      // Update both states to reflect the saved changes
      setDetails(newData);
      setOriginalDetails(updatedOriginal);
    } else {
      console.log("ℹ️ No changes detected - no API calls made");
      alert("No changes to apply.");
    }
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  return (
    <div className="p-4 text-black">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{clientName}</h2>
        <div className="space-x-2">
          <button
            onClick={handleAddRow}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            Add Row
          </button>
          <button
            onClick={handleApplyChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Apply Changes
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 text-sm table-fixed">
          <thead>
            <tr className="bg-gray-100 font-semibold text-black">
              <th className="p-2 border">S.No.</th>
              {columns.map((col) => (
                <th key={col.key} className="p-2 border">{col.label}</th>
              ))}
              <th className="p-2 border">Delete</th>
            </tr>
          </thead>
          <tbody>
            {details.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="p-4 text-center text-gray-500"
                >
                  No details found.
                </td>
              </tr>
            ) : (
              details.map((item, idx) => (
                <tr key={item.id || `new-${idx}`} className="hover:bg-gray-50">
                  <td className="p-2 border text-center">{idx + 1}</td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="p-2 border cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(idx, col.key)}
                    >
                      {editing.row === idx && editing.key === col.key ? (
                        <input
                          type={col.key.includes("date") ? "date" : "text"}
                          value={
                            col.key.includes("date")
                              ? formatDate(item[col.key])
                              : item[col.key] || ""
                          }
                          onChange={(e) => handleChange(e, idx, col.key)}
                          onBlur={handleBlur}
                          autoFocus
                          className="w-full border px-1 py-0.5 text-sm"
                        />
                      ) : col.key.includes("date") ? (
                        formatDate(item[col.key])
                      ) : (
                        item[col.key]
                      )}
                    </td>
                  ))}
                  <td className="p-2 border text-center">
                    <button
                      onClick={() => handleDeleteRow(item.id, idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientDetails;