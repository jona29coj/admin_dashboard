"use client";
import React, { useState, useEffect } from "react";
import companyData from "../../../data/clients.json";
import moment from "moment-timezone";

const PollingDetailsTable = ({ pollingData }) => (
  <div className="bg-white p-4 rounded-md shadow w-full text-black">
    <h1 className="text-xl font-bold mb-4">Polling Details</h1>
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gray-200 text-black">
          <th className="border px-3 py-2">Slave ID</th>
          <th className="border px-3 py-2">Expected Count</th>
          <th className="border px-3 py-2">Actual Count</th>
          <th className="border px-3 py-2">Success %</th>
        </tr>
      </thead>
      <tbody>
        {pollingData.map(({ slaveId, expected, actual }) => {
          const success = ((actual / expected) * 100).toFixed(2);
          return (
            <tr key={slaveId} className="text-center hover:bg-gray-100">
              <td className="border px-3 py-2">{slaveId}</td>
              <td className="border px-3 py-2">{expected}</td>
              <td className="border px-3 py-2">{actual}</td>
              <td className="border px-3 py-2">{success}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const Clients = () => {
  const [selectedCompany, setSelectedCompany] = useState("metalware");
  const [lastRecordTimestamp, setLastRecordTimestamp] = useState("Loading...");
  const [pollingData, setPollingData] = useState([]);

  const selectedData = companyData[selectedCompany];

  useEffect(() => {
    const fetchTimestamp = async () => {
      try {
        const res = await fetch("/api/client-details");
        const data = await res.json();

        const rawTimestamp = data.last_record_timestamp;
        if (rawTimestamp) {
          const formatted = moment
            .utc(rawTimestamp)
            .tz("Asia/Kolkata")
            .format("YYYY-MM-DD HH:mm:ss");
          setLastRecordTimestamp(formatted);
        } else {
          setLastRecordTimestamp("N/A");
        }
      } catch (err) {
        console.error("Error fetching timestamp:", err);
        setLastRecordTimestamp("Error");
      }
    };

    fetchTimestamp();
  }, []);

  useEffect(() => {
    const fetchPollingData = async () => {
      try {
        const res = await fetch("/api/polling-count");
        const result = await res.json();
        const enriched = result.map(({ slaveId, actual }) => ({
          slaveId,
          actual,
          expected: 1440,
        }));
        setPollingData(enriched);
      } catch (err) {
        console.error("Error fetching polling data:", err);
        setPollingData([]);
      }
    };

    fetchPollingData();
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full max-w-7xl mx-auto p-4 text-black bg-gray-100">
      <div className="flex items-center gap-4">
        <label htmlFor="client-select" className="font-semibold text-lg">
          Select Client:
        </label>
        <select
          id="client-select"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="p-2 border rounded-md bg-white w-1/6 focus:outline-none"
        >
          {Object.keys(companyData).map((key) => (
            <option key={key} value={key}>
              {companyData[key].name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 w-full">
        <div className="bg-white p-5 rounded-md shadow w-full lg:w-1/2">
          <h1 className="text-2xl font-bold mb-4">Company Details</h1>
          <p><span className="font-semibold">Name:</span> {selectedData.name}</p>
          <p><span className="font-semibold">Address:</span> {selectedData.address}</p>
          <p><span className="font-semibold">Contact:</span> {selectedData.contact}</p>
          <p><span className="font-semibold">Current Version:</span> {selectedData.current_version}</p>
          <p className="mt-2"><span className="font-semibold">Last Record Timestamp:</span> {lastRecordTimestamp}</p>
        </div>

        <div className="bg-white p-5 rounded-md shadow w-full lg:w-1/2">
          <h1 className="text-2xl font-bold mb-4">Device Details</h1>
          <div className="flex flex-col gap-4">
            {[{
              name: "Lucy",
              id: "RPI-5",
              version: "v1",
              dateInstalled: "18 Mar 2025",
              deviceCount: 1,
              image: "/images/Lucy.jpg"
            }, {
              name: "Modbus",
              id: "USR-TCP232-410s",
              version: "v1",
              dateInstalled: "18 Mar 2025",
              deviceCount: 1,
              image: "/images/ModBus.jpg"
            }].map((device, index) => (
              <div
                className="flex border rounded-md shadow-sm overflow-hidden bg-white"
                key={index}
              >
                <div className="w-1/3 bg-gray-100 flex items-center justify-center p-3">
                  <img
                    src={device.image}
                    alt={device.name}
                    className="h-20 w-auto object-contain"
                  />
                </div>

                <div className="w-2/3 p-3 flex flex-col justify-center gap-1 text-sm text-gray-800">
                  <h3 className="text-base font-semibold text-gray-900">{device.name}</h3>
                  <p><strong>Device ID:</strong> {device.id}</p>
                  <p><strong>No. of Devices:</strong> {device.deviceCount}</p>
                  <p><strong>Version:</strong> {device.version}</p>
                  <p><strong>Installed On:</strong> {device.dateInstalled}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PollingDetailsTable pollingData={pollingData} />
    </div>
  );
};

export default Clients;
