import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { FaTachometerAlt,FaUsers, FaChartLine, FaBell, FaDownload, FaSlidersH, FaProjectDiagram } from 'react-icons/fa';


const Sidebar = () => {
  return (
    <div className="flex flex-col h-full bg-[#e8f5f1]">
        <Image src="/images/logo.png" width={10} height={10} layout="responsive" alt='logo' className='mt-4'/>
        <div className='flex flex-col mt-12 gap-4 pl-4'>
            <Link href="/" className='text-xl text-black font-bold flex gap-4 items-center'><FaTachometerAlt/>Dashboard</Link>
            <Link href="/clients" className='text-xl text-black font-bold flex gap-4 items-center'><FaUsers/>Clients</Link>
            <Link href="/elementsscore" className="text-xl text-black font-bold flex gap-4 items-center"><FaChartLine/>Elements Score</Link>
            <Link href="/alerts" className="text-xl text-black font-bold flex gap-4 items-center"><FaBell/>Alerts</Link>
            <Link href="/download" className="text-xl text-black font-bold flex gap-4 items-center"><FaDownload/> Download</Link>
            <Link href="/clientpipeline" className="text-xl text-black font-bold flex gap-4 items-center"><FaProjectDiagram /> Client Pipeline</Link>
            <Link href="/control" className="text-xl text-black font-bold flex gap-4 items-center"><FaSlidersH/> Control</Link>
        </div>
    </div>
  )
}

export default Sidebar