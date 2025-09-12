"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

// Utility function for formatting header labels
const formatHeader = (key) => {
  const customLabels = {
    s_no: "S.No.",
    customer_name: "Client",
    inception_date: "Inception", // Changed from likely_to_close to inception_date
    last_touchpoint: "Last Touchpoint",
    action_required: "Action Required",
    type: "Type",
    phase: "Phase",
    latest_action_required: "Action Required",
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

  // Store last touchpoint info and inception date per clientId
  const [touchpoints, setTouchpoints] = useState({});
  const [inceptionDates, setInceptionDates] = useState({});
  const [latestActions, setLatestActions] = useState({});

  const router = useRouter();

  // Fetch clients data
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

  // Fetch latest interaction and first interaction (inception) for all clients
  const fetchTouchpointsAndInceptionDates = async (clientIds) => {
    if (!clientIds || clientIds.length === 0) return;
    const newTouchpoints = {};
    const newInceptionDates = {};
    const newLatestActions = {};
    
    await Promise.all(
      clientIds.map(async (id) => {
        try {
          // Fetch details for each client
          const res = await fetch(`/api/clients/${id}`);
          const details = await res.json();
          
          if (Array.isArray(details) && details.length > 0) {
            // Sort by interaction_date DESC for last touchpoint
            const sortedDesc = [...details].sort((a, b) => {
              const aDate = new Date(a.interaction_date || 0).getTime();
              const bDate = new Date(b.interaction_date || 0).getTime();
              return bDate - aDate;
            });
            
            // Get last touchpoint (first item after DESC sort)
            const latest = sortedDesc[0];
            if (latest && latest.interaction_date) {
              newTouchpoints[id] = {
                interaction_date: latest.interaction_date,
                interaction_type: latest.interaction_type || "",
              };
              newLatestActions[id] = latest.action_required || "";
            }
            
            // Sort by interaction_date ASC for inception date
            const sortedAsc = [...details].sort((a, b) => {
              const aDate = new Date(a.interaction_date || 0).getTime();
              const bDate = new Date(b.interaction_date || 0).getTime();
              return aDate - bDate;
            });
            
            // Get inception date (first item after ASC sort)
            const first = sortedAsc[0];
            if (first && first.interaction_date) {
              newInceptionDates[id] = first.interaction_date;
            }
          }
        } catch (err) {
          // If error, skip that client
          newTouchpoints[id] = null;
          newInceptionDates[id] = "";
          newLatestActions[id] = "";
        }
      })
    );
    
    setTouchpoints(newTouchpoints);
    setInceptionDates(newInceptionDates);
    setLatestActions(newLatestActions);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Whenever data is loaded, fetch touchpoints and inception dates
  useEffect(() => {
    const clientIds = data.filter((row) => !!row.id).map((row) => row.id);
    fetchTouchpointsAndInceptionDates(clientIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  // ✅ Apply filters without overwriting edits
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
      filtered = filtered.filter(
        (row) => row.likely_to_close === deadlineFilter
      );
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
      last_touchpoint: "",
      action_required: "",
      _isNew: true,
    };
    setData([...data, newRow]);
    setEditing({ row: data.length, key: "customer_name" });
  };

  const handleChange = (e, rowIndex, key) => {
    // last_touchpoint, latest_action_required, inception_date and s_no should not be editable
    if (key === "last_touchpoint" || key === "latest_action_required" || 
        key === "inception_date" || key === "s_no") return;
        
    const updated = [...data];
    const actualRowIndex = data.findIndex(
      (row) => row === displayData[rowIndex]
    );
    if (actualRowIndex !== -1) {
      updated[actualRowIndex][key] = e.target.value;
      setData(updated);
    }
  };

  // ✅ Handle both blur and Enter key
  const handleSaveEdit = () => {
    setEditing({ row: null, key: null });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      setEditing({ row: null, key: null });
    }
  };

  const handleDoubleClick = (rowIndex, key) => {
    // Disable editing for last_touchpoint, latest_action_required, inception_date and s_no
    if (key === "last_touchpoint" || key === "latest_action_required" || 
        key === "inception_date" || key === "s_no") return;
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

  // Updated columns to include inception_date instead of likely_to_close for display
  const columns = [
    "s_no",
    "customer_name",
    "phase",
    "type",
    "inception_date", // Changed from likely_to_close
    "last_touchpoint",
    "latest_action_required",
  ];

  // Check if row changed
  const hasRowChanged = (currentRow, originalRow) => {
    if (!originalRow) return true;
    // last_touchpoint, latest_action_required, inception_date and s_no are not editable
    return columns
      .filter((key) => key !== "last_touchpoint" && key !== "latest_action_required" && 
                key !== "inception_date" && key !== "s_no")
      .some((key) => {
        const currentValue = currentRow[key] || "";
        const originalValue = originalRow[key] || "";
        return currentValue !== originalValue;
      });
  };

  // ✅ Check that at least one field is filled
  const hasAnyFieldFilled = (row) => {
    return columns
      .filter((key) => key !== "last_touchpoint" && key !== "latest_action_required" && 
                key !== "inception_date" && key !== "s_no")
      .some(
        (key) =>
          row[key] !== undefined && row[key].toString().trim() !== ""
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
          setStatus({
            message: `Error creating client: ${err.message}`,
            type: "error",
          });
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
          setStatus({
            message: `Error updating client: ${err.message}`,
            type: "error",
          });
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
        // Skip s_no as we already have it as the first column
        if (col === "s_no") return;
        
        // For last_touchpoint, export the combined value
        if (col === "last_touchpoint" && row.id && touchpoints[row.id]) {
          const tp = touchpoints[row.id];
          rowData[formatHeader(col)] =
            tp.interaction_date && tp.interaction_type
              ? `${formatDate(tp.interaction_date)} (${tp.interaction_type})`
              : "";
        } 
        // For inception_date, export the first interaction date
        else if (col === "inception_date" && row.id && inceptionDates[row.id]) {
          rowData[formatHeader(col)] = formatDate(inceptionDates[row.id]);
        }
        // For latest_action_required
        else if (col === "latest_action_required" && row.id && latestActions[row.id]) {
          rowData[formatHeader(col)] = latestActions[row.id];
        } else {
          rowData[formatHeader(col)] = row[col] || "";
        }
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "Clients.xlsx");
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      const d = new Date(value);
      return d.toISOString().split("T")[0];
    } catch {
      return value;
    }
  };

  // ✅ Clear all filters
  const handleClearFilters = () => {
    setPhaseFilter("");
    setTypeFilter("");
    setDeadlineFilter("");
  };

  // --- CSS styles for sticky header ---
  const stickyHeaderStyles = {
    position: "sticky",
    top: 0,
    background: "#f3f4f6",
    zIndex: 2,
  };

  return (
    <div className="p-2 text-black bg-gray-100">
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
          <button
            onClick={handleClearFilters}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="w-full overflow-auto border-t-1 border-b-1">
        <div className="overflow-y-auto" style={{ maxHeight: "82vh" }}>
          <table className="min-w-full bg-white border text-sm">
            <thead>
              <tr className="bg-gray-100">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="border p-2"
                    style={stickyHeaderStyles}
                  >
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
                      
                    </div>
                  </th>
                ))}
                <th className="border p-2" style={stickyHeaderStyles}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, displayIndex) => {
                const actualIndex = data.findIndex((dataRow) => dataRow === row);

                return (
                  <tr
                    key={row.id || `new-${actualIndex}`}
                    className="hover:bg-gray-50"
                  >
                    {columns.map((key) => {
                      // For s_no, display the index
                      if (key === "s_no") {
                        return (
                          <td
                            key={key}
                            className="border p-2 text-center"
                          >
                            {displayIndex + 1}
                          </td>
                        );
                      }
                      
                      // For last_touchpoint, display latest interaction and disable editing
                      if (key === "last_touchpoint") {
                        // Only show for rows with existing client id
                        const tp =
                          row.id && touchpoints[row.id]
                            ? touchpoints[row.id]
                            : null;
                        const combined =
                          tp && tp.interaction_date
                            ? `${formatDate(tp.interaction_date)}${
                                tp.interaction_type
                                  ? " (" + tp.interaction_type + ")"
                                  : ""
                              }`
                            : "";
                        return (
                          <td
                            key={key}
                            className="border p-2 cursor-cursor"
                            title="Last touchpoint is auto-fetched"
                          >
                            {combined}
                          </td>
                        );
                      }
                      
                      // For inception_date, display first interaction date and disable editing
                      if (key === "inception_date") {
                        const inceptionDate = row.id && inceptionDates[row.id] 
                          ? formatDate(inceptionDates[row.id]) 
                          : "";
                        return (
                          <td
                            key={key}
                            className="border p-2 cursor-cursor text-nowrap"
                            title="Inception date is auto-fetched"
                          >
                            {inceptionDate}
                          </td>
                        );
                      }
                      
                      // For latest_action_required, display latest action and disable editing
                      if (key === "latest_action_required") {
                        const val =
                          row.id && latestActions[row.id]
                            ? latestActions[row.id]
                            : "";
                        return (
                          <td
                            key={key}
                            className="border p-2 cursor-cursor"
                            title="Action Required is auto-fetched"
                          >
                            {val}
                          </td>
                        );
                      }
                      
                      return (
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
                                onChange={(e) =>
                                  handleChange(e, actualIndex, key)
                                }
                                onBlur={handleSaveEdit}
                                onKeyDown={handleKeyPress}
                                autoFocus
                                className="w-full border px-1 py-0.5 text-sm"
                              />
                            ) : (
                              <input
                                value={row[key] || ""}
                                onChange={(e) =>
                                  handleChange(e, actualIndex, key)
                                }
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
                      );
                    })}
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="text-red-500 hover:text-red-700 text-lg"
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
    </div>
  );
};

export default ClientsTable;