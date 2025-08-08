"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

const ClientDetails = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const nameFromQuery = searchParams.get("name");

  const [details, setDetails] = useState([]);
  const [clientName, setClientName] = useState("Client Details");
  const [editing, setEditing] = useState({ row: null, key: null });

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      setDetails(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch client details:", error);
    }
  };

  useEffect(() => {
    if (nameFromQuery) {
      setClientName(nameFromQuery);
    }

    if (id) {
      fetchDetails();
    }
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
    };

    setDetails([...details, newRow]);
    setEditing({ row: details.length, key: "interaction_date" });
  };

  const handleChange = (e, rowIndex, key) => {
    const updated = [...details];
    updated[rowIndex][key] = e.target.value;
    setDetails(updated);
  };

  const handleBlur = () => {
    setEditing({ row: null, key: null });
  };

  const handleDoubleClick = (rowIndex, key) => {
    setEditing({ row: rowIndex, key });
  };

  const handleApplyChanges = async () => {
    for (const row of details) {
      const {
        id: detailId,
        client_id,
        interaction_date,
        interaction_type,
        members,
        minutes_of_meeting,
        action_required,
        follow_up_date,
      } = row;

      if (!interaction_date?.trim()) continue;

      const payload = {
        client_id,
        interaction_date,
        interaction_type,
        members,
        minutes_of_meeting,
        action_required,
        follow_up_date,
      };

      try {
        if (detailId) {
          // Existing row, use PUT
          await fetch(`/api/clients/${client_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: detailId, ...payload }),
          });
        } else {
          // New row, use POST
          await fetch(`/api/clients/${client_id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.error("Save error:", err);
      }
    }

    await fetchDetails();
    setEditing({ row: null, key: null });
  };

  const columns = [
    { key: "interaction_date", label: "Interaction Date" },
    { key: "interaction_type", label: "Interaction Type" },
    { key: "members", label: "Members" },
    { key: "minutes_of_meeting", label: "Minutes of Meeting" },
    { key: "action_required", label: "Action Required" },
    { key: "follow_up_date", label: "Follow-up Date" },
  ];

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
                <th key={col.key} className="p-2 border">
                  {col.label}
                </th>
              ))}
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