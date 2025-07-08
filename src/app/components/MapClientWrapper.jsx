'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const OpenLayersMap = dynamic(() => import('./OpenLayersMap'), { ssr: false });

export default function MapClientWrapper() {
  return <div className="w-full h-full"><OpenLayersMap /></div>;
}
