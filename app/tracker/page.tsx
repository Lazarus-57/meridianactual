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

export default function TrackerPage() {
  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden">
      <style jsx global>{`html, body { overflow: hidden; height: 100vh; }`}</style>

      {/* Top Bar */}
      <div className="z-10 px-8 py-3 flex justify-between items-center border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <a href="/" className="text-xl font-light tracking-widest text-white hover:text-cyan-400 transition-colors duration-300">
            MERIDIAN<span className="text-emerald-400">.</span>ACTUAL
          </a>
        </div>
        <div className="text-xs text-zinc-500 font-mono">Mk.1</div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapComponent />
      </div>
    </div>
  );
}
