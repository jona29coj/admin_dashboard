"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

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
  const [status, setStatus] = useState({ message: "", type: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Filter states
  const [phaseFilter, setPhaseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState("");

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
      setStatus({ message: "Failed to fetch clients.", type: "error" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ FIXED: Apply filters without overwriting edits
  const getFilteredData = () => {
    let filtered = [...data];

    if (phaseFilter) {
      filtered = filtered.filter(
        (row) => row.phase?.toLowerCase() === phaseFilter.toLowerCase()
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(
        (row) => row.type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    if (deadlineFilter) {
      filtered = filtered.filter((row) => row.likely_to_close === deadlineFilter);
    }

    return filtered;
  };

  const displayData = getFilteredData();

  const handleAddRow = () => {
    const hasPending = data.some((row) => !row.id && row._isNew);
    if (hasPending) return;

    const newRow = {
      id: null,
      customer_name: "",
      phase: "",
      type: "",
      likely_to_close: "",
      remarks: "",
      last_touchpoint: "",
      action_required: "",
      _isNew: true,
    };
    setData([...data, newRow]);
    setEditing({ row: data.length, key: "customer_name" });
  };

  const handleChange = (e, rowIndex, key) => {
    const updated = [...data];
    // ✅ Find the actual row in the full data array, not the filtered display
    const actualRowIndex = data.findIndex(row => row === displayData[rowIndex]);
    if (actualRowIndex !== -1) {
      updated[actualRowIndex][key] = e.target.value;
      setData(updated);
    }
  };

  // ✅ FIXED: Handle both blur and Enter key
  const handleSaveEdit = () => {
    setEditing({ row: null, key: null });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setEditing({ row: null, key: null });
    }
  };

  const handleDoubleClick = (rowIndex, key) => {
    setEditing({ row: rowIndex, key });
  };

  const handleDeleteRow = async (id) => {
    if (!id) {
      setData((prev) => prev.filter((row) => row.id !== id));
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

      setData((prev) => prev.filter((row) => row.id !== id));
      setOriginalData((prev) => prev.filter((row) => row.id !== id));
      setStatus({ message: "Client deleted successfully.", type: "success" });
    } catch (err) {
      setStatus({ message: "Failed to delete client.", type: "error" });
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

  // Check if row changed
  const hasRowChanged = (currentRow, originalRow) => {
    if (!originalRow) return true;
    return columns.some((key) => {
      const currentValue = currentRow[key] || "";
      const originalValue = originalRow[key] || "";
      return currentValue !== originalValue;
    });
  };

  // ✅ Check that at least one field is filled
  const hasAnyFieldFilled = (row) => {
    return columns.some(
      (key) => row[key] !== undefined && row[key].toString().trim() !== ""
    );
  };

  const handleApplyChanges = async () => {
    setIsProcessing(true);
    setStatus({ message: "", type: "" });

    let changesMade = false;
    const newData = [...data];
    const updatedOriginal = [...originalData];

    // Filter out completely empty new rows
    const rowsToProcess = data.filter((row) => {
      if (row.id && !row._isNew) return true;
      return hasAnyFieldFilled(row);
    });

    setData(rowsToProcess);

    for (let i = 0; i < rowsToProcess.length; i++) {
      const row = rowsToProcess[i];
      const originalRow = originalData.find((r) => r.id === row.id);

      if (!hasRowChanged(row, originalRow)) continue;

      if (!row.id || row._isNew) {
        try {
          const { _isNew, ...payload } = row;
          // ✅ Handle empty dates
          if (payload.likely_to_close === "") {
            payload.likely_to_close = null;
          }
          
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to create client");
          }
          const inserted = await res.json();

          const updatedRow = { ...payload, id: inserted.id };
          newData[i] = updatedRow;
          updatedOriginal.push(updatedRow);
          changesMade = true;
        } catch (err) {
          setStatus({ message: `Error creating client: ${err.message}`, type: "error" });
          setIsProcessing(false);
          return;
        }
      } else {
        try {
          // ✅ Handle empty dates for updates too
          const updatePayload = { ...row };
          if (updatePayload.likely_to_close === "") {
            updatePayload.likely_to_close = null;
          }

          const res = await fetch("/api/clients", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatePayload),
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to update client");
          }
          await res.json();

          const idx = updatedOriginal.findIndex((r) => r.id === row.id);
          if (idx > -1) updatedOriginal[idx] = { ...row };
          else updatedOriginal.push({ ...row });

          changesMade = true;
        } catch (err) {
          setStatus({ message: `Error updating client: ${err.message}`, type: "error" });
          setIsProcessing(false);
          return;
        }
      }
    }

    if (changesMade) {
      setStatus({ message: "Changes applied successfully!", type: "success" });
      setData(newData);
      setOriginalData(updatedOriginal);
    } else {
      setStatus({ message: "No changes to apply.", type: "info" });
    }

    setIsProcessing(false);
  };

  // ✅ Download Excel
  const handleDownloadExcel = () => {
    if (data.length === 0) {
      setStatus({ message: "No data to export.", type: "warning" });
      return;
    }

    const exportData = data.map((row, index) => {
      const rowData = { "S.No.": index + 1 };
      columns.forEach((col) => {
        rowData[formatHeader(col)] = row[col] || "";
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "Clients.xlsx");
  };

  // ✅ Clear all filters
  const handleClearFilters = () => {
    setPhaseFilter("");
    setTypeFilter("");
    setDeadlineFilter("");
  };

  return (
    <div className="p-4 text-black bg-gray-100">
      {status.message && (
        <div
          className={`mb-4 p-2 rounded text-white ${
            status.type === "success"
              ? "bg-green-600"
              : status.type === "error"
              ? "bg-red-600"
              : status.type === "warning"
              ? "bg-yellow-500"
              : "bg-blue-600"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Clients</h1>
        <div className="space-x-2">
          <button
            onClick={handleAddRow}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
          >
            Add Row
          </button>
          <button
            onClick={handleApplyChanges}
            disabled={isProcessing}
            className={`px-3 py-1 rounded text-white ${
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isProcessing ? "Applying..." : "Apply Changes"}
          </button>
          <button
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            Download Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">S.No.</th>
              {columns.map((col) => (
                <th key={col} className="border p-2">
                  <div className="flex flex-col">
                    <span>{formatHeader(col)}</span>
                    {col === "phase" && (
                      <select
                        value={phaseFilter}
                        onChange={(e) => setPhaseFilter(e.target.value)}
                        className="mt-1 border rounded px-1 py-0.5 text-xs"
                      >
                        <option value="">All</option>
                        <option>Complete</option>
                        <option>Energy Audit</option>
                        <option>Discussed</option>
                        <option>Proposal</option>
                        <option>Initiated</option>
                      </select>
                    )}
                    {col === "type" && (
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="mt-1 border rounded px-1 py-0.5 text-xs"
                      >
                        <option value="">All</option>
                        <option>Warm</option>
                        <option>Hot</option>
                        <option>Cold</option>
                      </select>
                    )}
                    {col === "likely_to_close" && (
                      <input
                        type="date"
                        value={deadlineFilter}
                        onChange={(e) => setDeadlineFilter(e.target.value)}
                        className="mt-1 border rounded px-1 py-0.5 text-xs"
                      />
                    )}
                  </div>
                </th>
              ))}
              <th className="border p-2">Delete</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, displayIndex) => {
              // ✅ Find the actual index in the full data array
              const actualIndex = data.findIndex(dataRow => dataRow === row);
              
              return (
                <tr key={row.id || `new-${actualIndex}`} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{displayIndex + 1}</td>
                  {columns.map((key) => (
                    <td
                      key={key}
                      className="border p-2 cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(actualIndex, key)}
                    >
                      {editing.row === actualIndex && editing.key === key ? (
                        key === "likely_to_close" ? (
                          <input
                            type="date"
                            value={row[key] || ""}
                            onChange={(e) => handleChange(e, actualIndex, key)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyPress}
                            autoFocus
                            className="w-full border px-1 py-0.5 text-sm"
                          />
                        ) : (
                          <input
                            value={row[key] || ""}
                            onChange={(e) => handleChange(e, actualIndex, key)}
                            onBlur={handleSaveEdit}
                            onKeyDown={handleKeyPress}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsTable;