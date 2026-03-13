'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/app/components/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-slate-950 text-gray-400">
      Loading map...
    </div>
  ),
});

export default function Home() {
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-transparent pt-6 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Meridian Actual
          </h1>
          <p className="text-lg text-gray-400 mt-1">Live spacecraft tracking over India</p>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent />
      </div>
    </div>
  );
}