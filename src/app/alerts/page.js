'use client';
import React, { useEffect, useState } from 'react';

const Alerts = () => {
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        setAlertsData(data);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">Alerts Table</h1>
      {loading ? (
        <p>Loading...</p>
      ) : alertsData.length === 0 ? (
        <p>No alerts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 text-left">S.No.</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Time</th>
                <th className="py-2 px-4 text-left">Alert</th>
                <th className="py-2 px-4 text-left">Limit</th>
                <th className="py-2 px-4 text-left">Value</th>
              </tr>
            </thead>
            <tbody>
              {alertsData.map((alert) => (
                <tr key={alert.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{alert.id}</td>
                  <td className="py-2 px-4">{alert.date}</td>
                  <td className="py-2 px-4">{alert.time}</td>
                  <td className="py-2 px-4">{alert.alert}</td>
                  <td className="py-2 px-4">{alert.limit}</td>
                  <td className="py-2 px-4">{alert.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Alerts;
