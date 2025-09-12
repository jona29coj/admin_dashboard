"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

const ClientDetails = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const nameFromQuery = searchParams.get("name");

  const [details, setDetails] = useState([]);
  const [originalDetails, setOriginalDetails] = useState([]);
  const [clientName, setClientName] = useState("Client Details");
  const [editing, setEditing] = useState({ row: null, key: null });
  // New state for contact information
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });

  const fetchDetails = async () => {
    try {
      console.log("🔄 Fetching details for client ID:", id);
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      console.log("📊 Fetched data:", data);
      const safeData = Array.isArray(data) ? data : [];
      setDetails(safeData);
      setOriginalDetails(JSON.parse(JSON.stringify(safeData)));
      
      // You might want to fetch contact info from your API as well
      // For now, we'll set it from the query parameter
      if (nameFromQuery) {
        setContactInfo(prev => ({...prev, name: nameFromQuery}));
      }
    } catch (error) {
      console.error("Failed to fetch client details:", error);
    }
  };

  useEffect(() => {
    if (nameFromQuery) {
      setClientName(nameFromQuery);
      setContactInfo(prev => ({...prev, name: nameFromQuery}));
    }
    if (id) fetchDetails();
  }, [id, nameFromQuery]);

  const handleAddRow = () => {
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
      _isNew: true,
    };

    setDetails([...details, newRow]);
    setEditing({ row: details.length, key: "interaction_date" });
  };

  const handleChange = (e, rowIndex, key) => {
    const updated = [...details];
    updated[rowIndex][key] = e.target.value;
    setDetails(updated);
  };

  // Handle contact info changes
  const handleContactChange = (e, field) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleBlur = () => setEditing({ row: null, key: null });

  // Handle keyboard events (Enter to save, Escape to cancel)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditing({ row: null, key: null });
    }
  };

  const handleDoubleClick = (rowIndex, key) => {
    setEditing({ row: rowIndex, key });
  };

  const handleDeleteRow = async (rowId, rowIndex) => {
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
    { key: "s_no", label: "S.No." },
    { key: "interaction_date", label: "Interaction Date" },
    { key: "interaction_type", label: "Interaction Type" },
    { key: "members", label: "Members" },
    { key: "minutes_of_meeting", label: "Minutes of Meeting" },
    { key: "action_required", label: "Action Required" },
    { key: "follow_up_date", label: "Follow-up Date" },
  ];

  const hasRowChanged = (currentRow, originalRow) => {
    if (!originalRow) return true;
    return columns
      .filter(col => col.key !== "s_no")
      .some((col) => {
        const currentValue = currentRow[col.key] || "";
        const originalValue = originalRow[col.key] || "";
        return currentValue !== originalValue;
      });
  };

  // Checks that at least one field is filled
  const hasAnyFieldFilled = (row) => {
    return columns
      .filter(col => col.key !== "s_no")
      .some(
        (col) =>
          row[col.key] !== undefined && row[col.key].toString().trim() !== ""
      );
  };

  const handleApplyChanges = async () => {
    console.log("🔄 Starting apply changes...");
  
    let changesMade = false;
    const newData = [...details];
    const updatedOriginal = [...originalDetails];
  
    for (let i = 0; i < details.length; i++) {
      const row = details[i];
      const originalRow = originalDetails.find((r) => r.id === row.id);
  
      if (!hasRowChanged(row, originalRow)) continue;

      // Block empty rows
      if (!hasAnyFieldFilled(row)) {
        alert("Please fill at least one field before saving.");
        return;
      }
  
      if (!row.id || row._isNew) {
        try {
          const { _isNew, ...rowData } = row;
          const res = await fetch(`/api/clients/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rowData),
          });
  
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create detail");
          }
          const inserted = await res.json();
          newData[i] = { ...rowData, id: inserted.id };
          updatedOriginal.push({ ...rowData, id: inserted.id });
          changesMade = true;
        } catch (err) {
          alert(`Failed to create new record: ${err.message}`);
          return;
        }
      } else {
        try {
          const res = await fetch(`/api/clients/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(row),
          });
  
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to update detail");
          }
  
          const idx = updatedOriginal.findIndex((r) => r.id === row.id);
          if (idx > -1) {
            updatedOriginal[idx] = { ...row };
          } else {
            updatedOriginal.push({ ...row });
          }
          changesMade = true;
        } catch (err) {
          alert(`Failed to update record: ${err.message}`);
          return;
        }
      }
    }
  
    if (changesMade) {
      alert("Changes applied successfully!");
      setDetails(newData);
      setOriginalDetails(updatedOriginal);
    } else {
      alert("No changes to apply.");
    }
  };

  // Download Excel functionality
  const handleDownloadExcel = () => {
    if (details.length === 0) {
      alert("No data to export.");
      return;
    }

    const exportData = details.map((row, index) => {
      const rowData = {};
      columns.forEach((col) => {
        // Skip s_no as we'll handle it separately
        if (col.key === "s_no") return;
        
        // Format dates for Excel export
        if (col.key.includes("date")) {
          rowData[col.label] = formatDate(row[col.key]) || "";
        } else {
          rowData[col.label] = row[col.key] || "";
        }
      });
      return rowData;
    });

    // Add S.No. as the first column
    exportData.forEach((row, index) => {
      row["S.No."] = index + 1;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Extract first name only
    const firstName = clientName.split(' ')[0];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, `${firstName} - Details`);
    
    // Clean filename - remove special characters and use first name
    const cleanFileName = `${firstName.replace(/[^a-zA-Z0-9\s-]/g, '')} - Details.xlsx`;
    XLSX.writeFile(workbook, cleanFileName);
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toISOString().split("T")[0]; // safe for rendering inputs
    } catch {
      return value;
    }
  };

  // Sticky header styles
  const stickyHeaderStyles = {
    position: "sticky",
    top: 0,
    background: "#f3f4f6", // Tailwind's bg-gray-100
    zIndex: 2,
  };

  return (
    <div className="p-4 text-black bg-gray-100">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{clientName}</h2>
        <div className="space-x-2">
          <button
            onClick={handleAddRow}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
          >
            Add Row
          </button>
          <button
            onClick={handleApplyChanges}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Apply Changes
          </button>
          <button
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="mb-2 p-2 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-1">Contact Information</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs mb-1 font-semibold">Name</label>
            <input
              type="text"
              onChange={(e) => handleContactChange(e, "name")}
              className="w-full p-1 border border-gray-300 rounded text-sm"
              placeholder="Point of Contact"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold">Mail-id</label>
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => handleContactChange(e, "email")}
              className="w-full p-1 border border-gray-300 rounded text-sm"
              placeholder="Email Address"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold">Number</label>
            <input
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => handleContactChange(e, "phone")}
              className="w-full p-1 border border-gray-300 rounded text-sm"
              placeholder="Phone Number"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 font-semibold">Elements POC</label>
            <input
              type="tel"
              value={contactInfo.phone}
              onChange={(e) => handleContactChange(e, "phone")}
              className="w-full p-1 border border-gray-300 rounded text-sm"
              placeholder="Name"
            />
          </div>
        </div>
      </div>

      <div className="w-full overflow-auto border-t-1 border-b-1">
        <div className="overflow-y-auto" style={{ maxHeight: "67vh"}}>
          <table className="min-w-full bg-white border border-gray-300 text-sm table-fixed">
            <thead>
              <tr className="bg-gray-100 font-semibold text-black">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="p-2 border"
                    style={stickyHeaderStyles}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="p-2 border" style={stickyHeaderStyles}>
                  Delete
                </th>
              </tr>
            </thead>
            <tbody>
              {details.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-4 text-center text-gray-500"
                  >
                    No details found.
                  </td>
                </tr>
              ) : (
                details.map((item, idx) => (
                  <tr key={item.id || `new-${idx}`} className="hover:bg-gray-50">
                    {columns.map((col) => {
                      // For s_no, display the index
                      if (col.key === "s_no") {
                        return (
                          <td
                            key={col.key}
                            className="p-2 border text-center"
                          >
                            {idx + 1}
                          </td>
                        );
                      }
                      
                      return (
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
                              onKeyDown={handleKeyPress}
                              autoFocus
                              className="w-full border px-1 py-0.5 text-sm"
                            />
                          ) : col.key.includes("date") ? (
                            formatDate(item[col.key])
                          ) : (
                            item[col.key]
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 border text-center">
                      <button
                        onClick={() => handleDeleteRow(item.id, idx)}
                        className="text-red-500 hover:text-red-700 text-lg"
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
    </div>
  );
};

export default ClientDetails;