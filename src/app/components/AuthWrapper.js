"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  /*useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          window.location.href = "https://elementsenergies.com/login";
          return;
        }

        const data = await res.json();
        if (!data.authenticated) {
          window.location.href = "https://elementsenergies.com/login";
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        window.location.href = "https://elementsenergies.com/login";
      }
    };

    checkAuth();
  }, []);*/

  return (
    <>
      <div className="fixed w-[15%] h-screen">
        <Sidebar />
      </div>
      <div className="ml-[15%] flex flex-col w-[85%]">
        <div className="h-12 top-0 left-[15%] w-[85%] flex fixed">
          <Navbar />
        </div>
        <div className="h-[94%] mt-12 bg-gray-100">{children}</div>
      </div>
    </>
  );
}
