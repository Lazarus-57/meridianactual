'use client';

import { MapContainer as LeafletMap, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

export default function MapContainer() {
  useEffect(() => {
    // Fix Leaflet default icons in Next.js
    delete (window as any).L.Icon.Default.prototype._getIconUrl;
    (window as any).L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <LeafletMap
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{ height: '100vh', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <ZoomControl position="bottomright" />
    </LeafletMap>
  );
}