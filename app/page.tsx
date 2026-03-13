'use client';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/app/components/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-black text-gray-400">
      Loading Meridian Actual...
    </div>
  ),
});

export default function Home() {
  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      {/* Futuristic Header - SpaceX style */}
      <header className="z-10 bg-gradient-to-b from-black via-zinc-950 to-transparent pt-8 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter text-white">
              MERIDIAN<span className="text-emerald-400">.</span>ACTUAL
            </h1>
            <p className="text-lg text-zinc-400 mt-1 tracking-wide">
              LIVE SPACECRAFT TRACKING OVER INDIA
            </p>
          </div>
          <div className="text-xs text-zinc-500 font-mono">v0.1 • DAY 1</div>
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent />
      </div>
    </div>
  );
}