"use client";

import React, { useState } from "react";
import { saveAs } from "file-saver";
import axios from "axios";

const Download = () => {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [template, setTemplate] = useState("hourly");

  const handleDownload = async () => {
    if (!startDateTime || !endDateTime) {
      alert("Please select both start and end times.");
      return;
    }

    try {
      const res = await axios.get("/api/download", {
        params: {
          startDateTime,
          endDateTime,
          template
        },
        responseType: "blob",
      });

      saveAs(res.data, `Consumption_${template}.xlsx`);
    } catch (error) {
      console.error("Error downloading file", error);
      alert(error.response?.data?.error || "Failed to download report.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 border text-black">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Download Excel Report
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Start Date-Time
          </label>
          <input
            type="datetime-local"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            End Date-Time
          </label>
          <input
            type="datetime-local"
            value={endDateTime}
            onChange={(e) => setEndDateTime(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Template Type
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition"
        >
          ⬇️ Download Excel
        </button>
      </div>
    </div>
  );
};

export default Download;
