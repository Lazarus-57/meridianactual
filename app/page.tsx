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
      {/* Minimal Top Bar */}
      <div className="z-10 px-8 py-4 flex justify-between items-center border-b border-zinc-900">
        <h2 className="text-xl font-light tracking-widest text-white">
          MERIDIAN<span className="text-emerald-400">.</span>ACTUAL
        </h2>
        <div className="text-xs text-zinc-500 font-mono">v0.1 • DAY 1</div>
      </div>

      {/* Hero Section */}
      <div className="flex-none px-8 pt-12 pb-6">
        <div className="max-w-4xl">
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-2">
            Every launch. Overhead. Live
          </h1>
          <p className="text-sm text-zinc-500 tracking-wide font-light">
            Live spacecraft tracking over India
          </p>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent />
      </div>
    </div>
  );
}