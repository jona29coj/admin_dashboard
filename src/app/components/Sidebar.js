"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  FaTachometerAlt,
  FaUsers,
  FaBell,
  FaDownload,
  FaSlidersH,
  FaProjectDiagram,
  FaRegCalendarCheck,
} from "react-icons/fa";

const Sidebar = () => {
  const pathname = usePathname();
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [digitalTwinOpen, setDigitalTwinOpen] = useState(false);
  const [username, setUsername] = useState(null);

  // Fetch username
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setUsername(data.username || null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  // Only these users can see Team History
  const ALLOWED_USERS = ["Auna Sando", "Anson Sando"];

  const links = [
    { href: "/", label: "Dashboard", icon: <FaTachometerAlt /> },
    { href: "/clients", label: "Clients", icon: <FaUsers /> },
    { href: "/alerts", label: "Alerts", icon: <FaBell /> },
    { href: "/download", label: "Download", icon: <FaDownload /> },
    { href: "/clientpipeline", label: "Client Pipeline", icon: <FaProjectDiagram /> },
    { href: "/prediction", label: "Prediction", icon: <FaSlidersH /> },
  ];

  return (
    <div className="flex flex-col h-screen w-[100%] bg-[#e8f5f1] shadow-lg rounded-sm">
      {/* Logo */}
      <div className="flex items-center justify-center py-6 border-gray-200">
        <Image
          src="/images/logo.png"
          width={120}
          height={40}
          alt="logo"
          className="object-contain"
        />
      </div>

      {/* Navigation */}
      <div className="flex flex-col mt-8 gap-2 px-4">
        {/* Main Links */}
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-700 hover:bg-green-100 hover:text-green-700"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-base">{label}</span>
            </Link>
          );
        })}

        {/* Attendance Dropdown */}
        <div>
          <button
            onClick={() => setAttendanceOpen(!attendanceOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              pathname.startsWith("/attendance")
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-700 hover:bg-green-100 hover:text-green-700"
            }`}
          >
            <span className="text-lg">
              <FaRegCalendarCheck />
            </span>
            <span className="text-base">Attendance</span>
          </button>

          {attendanceOpen && (
            <div className="ml-12 mt-2 flex flex-col gap-2">
              <Link
                href="/attendance/mark"
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  pathname === "/attendance/mark"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                }`}
              >
                Mark Attendance
              </Link>

              <Link
                href="/attendance/ihistory"
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  pathname === "/attendance/ihistory"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                }`}
              >
                Attendance History
              </Link>

              {/* Team History - Restricted */}
              {ALLOWED_USERS.includes(username) && (
                <Link
                  href="/attendance/ohistory"
                  className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    pathname === "/attendance/ohistory"
                      ? "bg-green-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                  }`}
                >
                  Team History
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Digital Twin Dropdown */}
        <div>
          <button
            onClick={() => setDigitalTwinOpen(!digitalTwinOpen)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              pathname.startsWith("/rvtmodelviewer") ||
              pathname.startsWith("/airportrvtmodelviewer")
                ? "bg-green-600 text-white shadow-md"
                : "text-gray-700 hover:bg-green-100 hover:text-green-700"
            }`}
          >
            <span className="text-lg">
              <FaProjectDiagram />
            </span>
            <span className="text-base">Digital Twin</span>
          </button>

          {digitalTwinOpen && (
            <div className="ml-12 mt-2 flex flex-col gap-2">
              <Link
                href="/rvtmodelviewer"
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  pathname === "/rvtmodelviewer"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                }`}
              >
                Demo
              </Link>

              <Link
                href="/airportrvtmodelviewer"
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  pathname === "/airportrvtmodelviewer"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-green-100 hover:text-green-700"
                }`}
              >
                Delhi Airport
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto mb-6 px-4">
        <p className="text-xs text-gray-500 text-center">
          © 2025 Elements Energies
        </p>
      </div>
    </div>
  );
};

export default Sidebar;