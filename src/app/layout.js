import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Admin",
  description: "EE Admin",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`flex h-screen w-screen ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="fixed w-[15%] h-screen">
          <Sidebar/>
        </div>
        <div className="ml-[15%] flex flex-col w-[85%]">
          <div className="h-12 top-0 left-[15%] w-[85%] flex fixed">
            <Navbar />
          </div>
          <div className="h-[94%] mt-12 bg-gray-100">{children}</div>

        </div>
      </body>
    </html>
  );
}
