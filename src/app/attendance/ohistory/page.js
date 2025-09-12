"use client";
import React, { useState, useEffect } from "react";
import moment from "moment-timezone";

const AttendanceOHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/attendance/overall`);
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
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
        Team Attendance History
      </h1>

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                  Loading team attendance records...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                  No team attendance records found
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
