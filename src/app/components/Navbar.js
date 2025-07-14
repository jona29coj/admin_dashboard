"use client";
import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaUser } from 'react-icons/fa';

const Navbar = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [alert, setAlert] = useState(null);

  const notificationRef = useRef();
  const profileRef = useRef();

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const res = await fetch('/api/alerts');
        const data = await res.json();
        if (data.length > 0) {
          setAlert(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };

    fetchAlert();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        notificationRef.current && !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current && !profileRef.current.contains(e.target)
      ) {
        setShowProfile(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-[#6ca896] flex w-full justify-end items-center pr-8 py-2">
      <div className="relative flex items-center space-x-6">
        <div ref={notificationRef} className="relative">
          <FaBell
            size={24}
            className="cursor-pointer"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
          />
          {showNotifications && (
  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md p-4 z-10 border border-gray-200">
    {alert ? (
      <div className="flex items-start gap-3">
      

        <div className="flex-1">
          <h3 className="text-md font-semibold text-red-700 mb-1">🚨 Data Missing Alert</h3>
          <p className="text-sm text-gray-800"><strong>Client:</strong> Metalware</p>
          <p className="text-sm text-gray-800"><strong>Last Record:</strong> {alert.date} {alert.time}</p>
          <p className="text-sm text-gray-800"><strong>Gap:</strong> {alert.value}</p>
          <p className="text-xs text-gray-500 mt-2">Please check device connectivity or data polling.</p>
        </div>
      </div>
    ) : (
      <div className="flex items-center text-green-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L9 13.414l4.707-4.707z"
            clipRule="evenodd" />
        </svg>
        <p className="text-sm">No alerts at the moment</p>
      </div>
    )}
  </div>
)}

        </div>

        <div ref={profileRef} className="relative">
          <FaUser
            size={24}
            className="cursor-pointer"
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
          />
          {showProfile && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-md p-4 z-10">
              <p className="text-sm font-semibold text-gray-800 mb-2">Hi Admin</p>
              <button className="text-sm text-red-600 hover:underline">Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
