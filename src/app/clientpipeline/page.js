"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const formatHeader = (key) => {
  const customLabels = {
    customer_name: "Client",
    likely_to_close: "Deadline",
  };
  return (
    customLabels[key] ||
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

const ClientsTable = () => {
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [editing, setEditing] = useState({ row: null, key: null });
  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/clients");
      const json = await res.json();
      const sorted = json.sort((a, b) => a.id - b.id);
      setData(sorted);
      setOriginalData(JSON.parse(JSON.stringify(sorted))); 
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    const hasPending = data.some(
      (row) => !row.id && (!row.customer_name || !row.customer_name.trim())
    );
    if (hasPending) return;

    const newRow = {
      id: null, // Explicitly set to null for new rows
      customer_name: "",
      phase: "",
      type: "",
      likely_to_close: "",
      remarks: "",
      last_touchpoint: "",
      action_required: "",
    };
    setData([...data, newRow]);
    setEditing({ row: data.length, key: "customer_name" });
  };

  const handleChange = (e, rowIndex, key) => {
    const updated = [...data];
    updated[rowIndex][key] = e.target.value;
    setData(updated);
  };

  const handleBlur = () => {
    setEditing({ row: null, key: null });
  };

  const handleDoubleClick = (rowIndex, key) => {
    setEditing({ row: rowIndex, key });
  };

  const handleDeleteRow = async (id) => {
    if (!id) {
      // Remove new row that hasn't been saved yet
      setData(data.filter((row) => row.id !== id));
      return;
    }
    if (!confirm("Are you sure you want to delete this client?")) return;
  
    try {
      const res = await fetch(`/api/clients`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
  
      if (!res.ok) throw new Error("Failed to delete client");
  
      setData(data.filter((row) => row.id !== id));
      setOriginalData(originalData.filter((row) => row.id !== id));
    } catch (err) {
      console.error("❌ DELETE error:", err);
      alert("Failed to delete client. Please try again.");
    }
  };

  const columns = [
    "customer_name",
    "phase",
    "type",
    "likely_to_close",
    "remarks",
    "last_touchpoint",
    "action_required",
  ];

  const normalizeValue = (value) => {
    if (value === null || value === undefined) return "";
    return value.toString().trim();
  };

  const handleApplyChanges = async () => {
    let changesMade = false;
    const updatedData = [...data];
    const newOriginalData = [...originalData];
  
    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      const originalRow = originalData.find(r => r.id === row.id);
  
      // --- CREATE Logic (New Rows) ---
      if (!row.id && row.customer_name?.trim()) {
        const allFilled = columns.every(col => {
          const value = normalizeValue(row[col]);
          return value !== "";
        });
        
        if (!allFilled) {
          alert("Please complete all fields for the new row.");
          continue;
        }
        
        try {
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create client");
          }
          
          const inserted = await res.json();
          console.log("✅ Created client:", inserted);
          
          // Update the row with the new ID
          updatedData[i] = { ...row, id: inserted.id };
          newOriginalData.push({ ...row, id: inserted.id });
          changesMade = true;
        } catch (err) {
          console.error("❌ POST error:", err);
          alert(`Failed to create client: ${err.message}`);
        }
      } 
      // --- UPDATE Logic (Existing Rows) ---
      else if (row.id && originalRow) {
        const hasChanges = columns.some(key => {
          const currentValue = normalizeValue(row[key]);
          const originalValue = normalizeValue(originalRow[key]);
          return currentValue !== originalValue;
        });
  
        if (hasChanges) {
          console.log("🔄 Updating row:", row.id, "Changes detected");
          try {
            const res = await fetch(`/api/clients`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(row),
            });
            
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || "Failed to update client");
            }
  
            console.log("✅ Updated client:", row.id);
            
            // Update originalData to reflect the changes
            const originalIndex = newOriginalData.findIndex(r => r.id === row.id);
            if (originalIndex > -1) {
              newOriginalData[originalIndex] = { ...row };
            }
            changesMade = true;
          } catch (err) {
            console.error("❌ PUT error:", err);
            alert(`Failed to update client: ${err.message}`);
          }
        }
      }
    }
  
    // --- Final State Update ---
    if (changesMade) {
      console.log("✅ Changes applied successfully");
      setData(updatedData);
      setOriginalData(newOriginalData);
    } else {
      console.log("ℹ️ No changes detected.");
    }
  };

  return (
    <div className="p-4 text-black">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Clients</h1>
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
        <table className="min-w-full bg-white border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">S.No.</th>
              {columns.map((col) => (
                <th key={col} className="border p-2">{formatHeader(col)}</th>
              ))}
              <th className="border p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={row.id || `new-${rowIndex}`} className="hover:bg-gray-50">
                <td className="border p-2 text-center">{rowIndex + 1}</td>
                {columns.map((key) => (
                  <td
                    key={key}
                    className="border p-2 cursor-pointer"
                    onDoubleClick={() => handleDoubleClick(rowIndex, key)}
                  >
                    {editing.row === rowIndex && editing.key === key ? (
                      key === "likely_to_close" ? (
                        <input
                          type="date"
                          value={row[key] || ""}
                          onChange={(e) => handleChange(e, rowIndex, key)}
                          onBlur={handleBlur}
                          autoFocus
                          className="w-full border px-1 py-0.5 text-sm"
                        />
                      ) : (
                        <input
                          value={row[key] || ""}
                          onChange={(e) => handleChange(e, rowIndex, key)}
                          onBlur={handleBlur}
                          autoFocus
                          className="w-full border px-1 py-0.5 text-sm"
                        />
                      )
                    ) : key === "customer_name" && row.id ? (
                      <span
                        onClick={() =>
                          router.push(
                            `/clientpipeline/${row.id}?name=${encodeURIComponent(
                              row.customer_name
                            )}`
                          )
                        }
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        {row[key]}
                      </span>
                    ) : (
                      row[key]
                    )}
                  </td>
                ))}
                <td className="border p-2 text-center">
                  <button
                    onClick={() => handleDeleteRow(row.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete row"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsTable;