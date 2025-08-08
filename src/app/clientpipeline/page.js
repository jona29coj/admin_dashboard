"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 🔹 Helper to format snake_case -> Capitalized Words (with custom labels)
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
  const [editing, setEditing] = useState({ row: null, key: null });
  const router = useRouter();

  const fetchData = async () => {
    try {
      const res = await fetch("/api/clients");
      const json = await res.json();
      const sorted = json.sort((a, b) => a.id - b.id);
      setData(sorted);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRow = () => {
    const hasPending = data.some(
      (row) => !row.id && !row.customer_name.trim()
    );
    if (hasPending) return;

    const newRow = {
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

  const handleApplyChanges = async () => {
    for (let row of data) {
      const payload = {
        customer_name: row.customer_name,
        phase: row.phase,
        type: row.type,
        likely_to_close: row.likely_to_close,
        remarks: row.remarks,
        last_touchpoint: row.last_touchpoint,
        action_required: row.action_required,
      };

      if (!row.customer_name?.trim()) continue;

      try {
        if (row.id) {
          await fetch("/api/clients", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: row.id, ...payload }),
          });
        } else {
          await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        }
      } catch (err) {
        console.error("Save error:", err);
      }
    }

    await fetchData();
    setEditing({ row: null, key: null });
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
                <th key={col} className="border p-2">
                  {formatHeader(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
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
                        className="text-blue-600 hover:underline"
                      >
                        {row[key]}
                      </span>
                    ) : (
                      row[key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientsTable;
