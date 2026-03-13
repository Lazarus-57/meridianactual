import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/app/components/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <div className="text-gray-400">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="z-20 bg-gradient-to-b from-slate-950 via-slate-950 to-transparent pt-8 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
            Meridian Actual
          </h1>
          <p className="text-gray-400 text-lg mt-2 font-light">
            Live spacecraft tracking over India
          </p>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <MapComponent />
      </div>

      {/* Footer Attribution */}
      <div className="absolute bottom-4 right-4 z-10 text-xs text-gray-500 pointer-events-none">
        <p>Space-themed tracking system</p>
      </div>
    </div>
  );
}
