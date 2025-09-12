'use client';
import React, { useState, useEffect } from "react";
import moment from "moment-timezone";

const OFFICE_LOCATION = {
  lat: 12.991195605861087,
  lng: 80.24296550905328,
};
const MAX_DISTANCE_METERS = 1000;

const MarkAttendance = () => {
  const [username, setUsername] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workSummary, setWorkSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    moment().tz("Asia/Kolkata").format("dddd, DD MMMM YYYY")
  );
  const [userLocation, setUserLocation] = useState(null);
  const [canCheckIn, setCanCheckIn] = useState(false);

  // Fetch username from /api/auth on mount
  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const res = await fetch("/api/auth");
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setUsername(data.username);
      } catch (err) {
        console.error("Failed to fetch username:", err);
        setUsername(null);
      }
    };
    fetchUsername();
  }, []);

  // Update current date every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(moment().tz("Asia/Kolkata").format("dddd, DD MMMM YYYY"));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's attendance once username is available
  useEffect(() => {
    if (!username) return;

    const fetchTodayAttendance = async () => {
      try {
        const res = await fetch(`/api/attendance/mark?username=${username}`);
        if (!res.ok) throw new Error("Failed to fetch attendance");
        const data = await res.json();
        const record = data.data;

        if (record) {
          if (!record.check_out) {
            setIsCheckedIn(true);
            setStartTime(new Date(record.check_in).getTime());
          } else {
            setAlreadyMarked(true);
            setWorkSummary({
              totalTime: record.work_hours,
              checkIn: moment(record.check_in).tz("Asia/Kolkata").format("hh:mm A"),
              checkOut: moment(record.check_out).tz("Asia/Kolkata").format("hh:mm A"),
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTodayAttendance();
  }, [username]);

  // Timer logic
  useEffect(() => {
    let timer;
    if (isCheckedIn && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckedIn, startTime]);

  // Geolocation check
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });

        const distance = getDistanceFromLatLonInMeters(
          latitude,
          longitude,
          OFFICE_LOCATION.lat,
          OFFICE_LOCATION.lng
        );
        setCanCheckIn(distance <= MAX_DISTANCE_METERS);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setCanCheckIn(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatTime = (seconds) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleCheckIn = async () => {
    if (!username) return;
    try {
      setLoading(true);
      const timestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, action: "checkin", timestamp }),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Check-in failed");
        return;
      }

      setIsCheckedIn(true);
      setStartTime(Date.now());
      setWorkSummary(null);
    } catch (err) {
      console.error(err);
      alert("Error during check-in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!username) return;
    try {
      setLoading(true);
      const timestamp = moment().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss");

      const res = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, action: "checkout", timestamp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check out");

      setIsCheckedIn(false);
      setWorkSummary({
        totalTime: data.data?.work_hours || formatTime(elapsedTime),
        checkIn: moment(startTime).tz("Asia/Kolkata").format("hh:mm A"),
        checkOut: moment().tz("Asia/Kolkata").format("hh:mm A"),
      });
      setElapsedTime(0);
      setStartTime(null);
      setAlreadyMarked(true);
    } catch (err) {
      console.error(err);
      alert("Error during check-out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading user info...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center">
        <p className="text-sm text-gray-500 mb-2">{currentDate}</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Hi, <span className="text-green-600">{username}</span>
        </h1>
        <p className="text-gray-600 mb-6">Mark your attendance below 👇</p>

        {isCheckedIn ? (
          <>
            <p className="text-lg font-semibold text-gray-700 mb-4">
              Work Time:{" "}
              <span className="text-blue-600">{formatTime(elapsedTime)}</span>
            </p>
            <button
              onClick={handleCheckOut}
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? "Checking Out..." : "Check Out"}
            </button>
          </>
        ) : alreadyMarked ? (
          <p className="text-green-600 font-medium mt-4">
            ✅ Attendance already marked today
          </p>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={loading || !canCheckIn}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl shadow-md transition disabled:opacity-50"
          >
            {loading
              ? "Checking In..."
              : canCheckIn
              ? "Check In"
              : "Please move closer to the office to check in"}
          </button>
        )}

        {workSummary && (
          <div className="mt-6 p-4 bg-gray-50 border rounded-xl text-left shadow-inner">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Attendance Summary
            </h2>
            <p className="text-gray-700">
              ✅ Check-In: <span className="font-medium">{workSummary.checkIn}</span>
            </p>
            <p className="text-gray-700">
              ⏰ Check-Out: <span className="font-medium">{workSummary.checkOut}</span>
            </p>
            <p className="text-gray-700">
              🕒 Total Work Time:{" "}
              <span className="font-medium text-blue-600">{workSummary.totalTime}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkAttendance;
