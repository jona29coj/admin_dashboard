"use client";
import React, { useState, useEffect } from "react";
import moment from "moment-timezone";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AttendanceOHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    moment().format("YYYY-MM")
  );

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/attendance/overall?month=${selectedMonth}`);
        if (!res.ok) throw new Error("Failed to fetch overall attendance history");

        const data = await res.json();
        setHistory(data.data || []);
      } catch (err) {
        console.error("Error fetching overall history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [selectedMonth]);

  // ✅ Frontend Excel Download Handler using XLSX
  const handleDownloadExcel = () => {
    if (!history || history.length === 0) {
      alert("No attendance data available to download!");
      return;
    }

    // Format data for Excel
    const formattedData = history.map((record) => ({
      Username: record.username || "-",
      Date: record.date ? moment(record.date).format("DD MMM YYYY") : "-",
      "Check-In": record.check_in
        ? moment(record.check_in).tz("Asia/Kolkata").format("hh:mm A")
        : "-",
      "Check-Out": record.check_out
        ? moment(record.check_out).tz("Asia/Kolkata").format("hh:mm A")
        : "-",
      "Total Hours": record.work_hours || "-",
      Status:
        record.status ||
        (record.check_in
          ? record.check_out
            ? "Present"
            : "Ongoing"
          : "Absent"),
      "Work Update": record.work_update || "-",
    }));

    // Create Excel worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    // Create Excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `attendance_${selectedMonth}.xlsx`);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* ✅ Title & Controls Row */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Team Attendance History
        </h1>

        {/* ✅ Controls (Month Picker + Download Button) */}
        <div className="flex items-center space-x-3 bg-white shadow-md px-4 py-2 rounded-xl">
          <label htmlFor="monthPicker" className="text-gray-700 font-semibold">
            Select Month:
          </label>
          <input
            id="monthPicker"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-gray-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
          />

          <button
            onClick={handleDownloadExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            Download Excel
          </button>
        </div>
      </div>

      {/* ✅ Attendance Table */}
      <div className="overflow-x-auto rounded-2xl shadow-lg bg-white">
        <table className="min-w-full border-collapse">
          <thead className="bg-green-100 text-gray-700">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-left">User</th>
              <th className="px-6 py-3 text-sm font-semibold text-left">Date</th>
              <th className="px-6 py-3 text-sm font-semibold text-left">Check-In</th>
              <th className="px-6 py-3 text-sm font-semibold text-left">Check-Out</th>
              <th className="px-6 py-3 text-sm font-semibold text-left">Total Hours</th>
              <th className="px-6 py-3 text-sm font-semibold text-left">Status</th>
              <th className="px-6 py-3 text-sm font-semibold text-center">
                Work Update
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-6 text-center text-gray-500">
                  Loading team attendance records...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-6 text-center text-gray-500">
                  No attendance records found for this month
                </td>
              </tr>
            ) : (
              history.map((record, index) => {
                const checkIn = record.check_in
                  ? moment(record.check_in).tz("Asia/Kolkata").format("hh:mm A")
                  : "-";
                const checkOut = record.check_out
                  ? moment(record.check_out).tz("Asia/Kolkata").format("hh:mm A")
                  : "-";
                const workHours = record.work_hours || "-";
                const workUpdate = record.work_update || "-";
                const status =
                  record.status ||
                  (record.check_in
                    ? record.check_out
                      ? "Present"
                      : "Ongoing"
                    : "Absent");

                return (
                  <tr
                    key={index}
                    className="border-b last:border-none hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {record.username}
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">
                      {record.date
                        ? moment(record.date).format("DD MMM YYYY")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{checkIn}</td>
                    <td className="px-6 py-4 text-gray-700">{checkOut}</td>
                    <td className="px-6 py-4 text-blue-600 font-semibold">
                      {workHours}
                    </td>
                    <td
                      className={`px-6 py-4 font-semibold ${
                        status === "Present"
                          ? "text-green-600"
                          : status === "Ongoing"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {status}
                    </td>
                    <td
                      className="px-6 py-4 text-gray-700 whitespace-pre-wrap break-words max-w-lg"
                      title={workUpdate}
                    >
                      {workUpdate}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceOHistory;