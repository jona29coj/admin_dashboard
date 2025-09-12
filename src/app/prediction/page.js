"use client";
import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import moment from "moment-timezone";

// Utility: format date as YYYY-MM-DD in Asia/Kolkata
const formatDate = (isoString) => {
  if (!isoString) return "";
  return moment.tz(isoString, "Asia/Kolkata").format("YYYY-MM-DD");
};

// Utility: extract hour from datetime in HH:00 format
const extractHour = (datetime) => {
  return moment.tz(datetime, "Asia/Kolkata").format("HH:00");
};

const Prediction = () => {
  const today = formatDate(new Date());
  const minDate = "2025-08-28";

  const [predictionData, setPredictionData] = useState([]);
  const [actualData, setActualData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(today);
  const [accuracy, setAccuracy] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Decide which endpoint to call
        const endpoint =
          selectedDate === today
            ? "/api/predict"
            : `/api/predict-history?date=${selectedDate}`;

        const res = await fetch(endpoint);
        const json = await res.json();

        // For today, /api/predict returns { predictions, actuals }
        const predictions = json.predictions || json;
        const actuals = json.actuals || [];

        setPredictionData(predictions);
        setActualData(actuals);
      } catch (error) {
        console.error("Error fetching data:", error);
        setPredictionData([]);
        setActualData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, today]);

  // Categories = hours from predictions or actuals
  const categories =
    predictionData.length > 0
      ? predictionData.map((row) => row.hour)
      : actualData.map((row) => row.hour);

  // Predicted series aligned with categories
  const predictedSeries = categories.map((hour) => {
    const match = predictionData.find((a) => a.hour === hour);
    return match ? match.predicted_kvah : null;
  });

  // Actual series aligned with categories
  const actualSeries = categories.map((hour) => {
    const match = actualData.find((a) => a.hour === hour);
    return match ? match.actual_kvah : null;
  });

  // Accuracy calculation
  useEffect(() => {
    if (predictionData.length > 0 && actualData.length > 0) {
      let totalAccuracy = 0;
      let count = 0;
      categories.forEach((hour, idx) => {
        const predicted = predictedSeries[idx];
        const actual = actualSeries[idx];
        if (predicted !== null && actual !== null) {
          const errorPct = Math.abs((actual - predicted) / predicted) * 100;
          const acc = Math.max(0, 100 - errorPct);
          totalAccuracy += acc;
          count++;
        }
      });
      setAccuracy(count > 0 ? (totalAccuracy / count).toFixed(2) : null);
    } else {
      setAccuracy(null);
    }
  }, [predictionData, actualData, categories]);

  const chartOptions = {
    chart: { type: "column", backgroundColor: "transparent", height: 400 },
    title: { text: null },
    xAxis: { categories },
    yAxis: { min: 0, title: { text: "kVAh" }, gridLineWidth: 0 },
    plotOptions: { column: { borderWidth: 2, borderDashStyle: "dot" } },
    series: [
      {
        name: "Predicted kVAh",
        data: predictedSeries,
        color: "rgba(255, 152, 0, 0.6)",
        borderColor: "rgba(255, 152, 0, 1)",
      },
      {
        name: "Actual kVAh",
        data: actualSeries,
        color: "rgba(33, 150, 243, 0.6)",
        borderColor: "rgba(33, 150, 243, 1)",
      },
    ],
    tooltip: { shared: true, valueSuffix: " kVAh" },
    legend: { enabled: true },
    credits: { enabled: false },
  };

  return (
    <div className="w-full h-full p-6">
      <div className="w-full bg-white shadow-lg rounded-lg p-6">
        {/* Title + Accuracy + Date Picker */}
        <div className="flex justify-between items-center pb-6">
          <h2 className="text-xl font-semibold text-black">
            Predicted vs Actual Hourly Energy Consumption
          </h2>
          <div className="flex items-center gap-3">
            {!loading && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  accuracy >= 90
                    ? "bg-green-100 text-green-700"
                    : accuracy >= 70
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {accuracy !== null ? `Accuracy: ${accuracy}%` : "N/A"}
              </span>
            )}
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 text-black"
              value={selectedDate}
              min={minDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <span className="text-gray-500 text-lg font-medium">Loading...</span>
          </div>
        ) : (
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{ style: { width: "100%", height: "400px" } }}
          />
        )}
      </div>
    </div>
  );
};

export default Prediction;
