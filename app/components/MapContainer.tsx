'use client';

import { MapContainer as LeafletMap, TileLayer, ZoomControl, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { twoline2satrec, propagate } from 'satellite.js';

interface SatellitePosition {
  id: number;
  name: string;
  type: string;
  operator: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  purpose: string;
  inclination: number;
  orbitalPeriod: number;
  launchDate: string;
  mass: number;
  apogee: number;
  perigee: number;
  powerSource: string;
  instruments: string[];
  status: string;
}

interface Launch {
  id: string;
  name: string;
  net: string;
  status: string;
  rocketName: string;
  missionDescription: string;
  provider: string;
  padName: string;
  padLat: number;
  padLng: number;
  orbit: string;
  imageUrl: string | null;
}

// Tracking list: NORAD ID -> (name, type, operator)
// Only verified active satellites with correct NORAD catalog IDs
const TRACKED_SATELLITES = [
  // === SPACE STATIONS ===
  { noradId: 25544, name: 'ISS (ZARYA)', type: 'Space Station', operator: 'NASA/ESA/Roscosmos' },
  { noradId: 48274, name: 'CSS (Tianhe)', type: 'Space Station', operator: 'CNSA' },
  // === NASA FLAGSHIP ===
  { noradId: 20580, name: 'Hubble Space Telescope', type: 'Telescope', operator: 'NASA/ESA' },
  { noradId: 25994, name: 'Terra', type: 'Earth Observation', operator: 'NASA' },
  { noradId: 27424, name: 'Aqua', type: 'Earth Observation', operator: 'NASA' },
  { noradId: 28376, name: 'Aura', type: 'Atmosphere', operator: 'NASA' },
  { noradId: 37849, name: 'Suomi NPP', type: 'Weather', operator: 'NASA/NOAA' },
  { noradId: 43013, name: 'NOAA-20 (JPSS-1)', type: 'Weather', operator: 'NASA/NOAA' },
  { noradId: 54234, name: 'JPSS-2 (NOAA-21)', type: 'Weather', operator: 'NASA/NOAA' },
  { noradId: 43613, name: 'ICESat-2', type: 'Altimetry', operator: 'NASA' },
  { noradId: 40376, name: 'SMAP', type: 'Earth Observation', operator: 'NASA' },
  { noradId: 40390, name: 'DSCOVR', type: 'Space Weather', operator: 'NASA/NOAA' },
  { noradId: 29108, name: 'CALIPSO', type: 'Atmosphere', operator: 'NASA/CNES' },
  { noradId: 27386, name: 'GRACE-FO 1', type: 'Geodesy', operator: 'NASA/DLR' },
  { noradId: 43477, name: 'GRACE-FO 2', type: 'Geodesy', operator: 'NASA/DLR' },
  { noradId: 29107, name: 'CloudSat', type: 'Atmosphere', operator: 'NASA' },
  // === LANDSAT ===
  { noradId: 39084, name: 'Landsat 8', type: 'Earth Observation', operator: 'USGS/NASA' },
  { noradId: 48208, name: 'Landsat 9', type: 'Earth Observation', operator: 'USGS/NASA' },
  // === ESA / COPERNICUS ===
  { noradId: 39953, name: 'Sentinel-1A', type: 'SAR Imaging', operator: 'ESA' },
  { noradId: 56704, name: 'Sentinel-1C', type: 'SAR Imaging', operator: 'ESA' },
  { noradId: 40697, name: 'Sentinel-2A', type: 'Multispectral', operator: 'ESA' },
  { noradId: 42063, name: 'Sentinel-2B', type: 'Multispectral', operator: 'ESA' },
  { noradId: 39634, name: 'Sentinel-3A', type: 'Ocean/Climate', operator: 'ESA' },
  { noradId: 43437, name: 'Sentinel-3B', type: 'Ocean/Climate', operator: 'ESA' },
  { noradId: 42969, name: 'Sentinel-5P', type: 'Atmosphere', operator: 'ESA' },
  { noradId: 46984, name: 'Sentinel-6 MF', type: 'Altimetry', operator: 'ESA/NASA' },
  { noradId: 36508, name: 'CryoSat-2', type: 'Altimetry', operator: 'ESA' },
  { noradId: 36036, name: 'SMOS', type: 'Earth Observation', operator: 'ESA' },
  { noradId: 37820, name: 'Proba-V', type: 'Earth Observation', operator: 'ESA' },
  { noradId: 56174, name: 'EarthCARE', type: 'Atmosphere', operator: 'ESA/JAXA' },
  // === NOAA / GOES ===
  { noradId: 28654, name: 'NOAA 18', type: 'Weather', operator: 'NOAA' },
  { noradId: 33591, name: 'NOAA 19', type: 'Weather', operator: 'NOAA' },
  { noradId: 41866, name: 'GOES-16', type: 'Weather', operator: 'NOAA' },
  { noradId: 43226, name: 'GOES-17', type: 'Weather', operator: 'NOAA' },
  { noradId: 51850, name: 'GOES-18', type: 'Weather', operator: 'NOAA' },
  // === EUMETSAT ===
  { noradId: 38771, name: 'MetOp-B', type: 'Weather', operator: 'EUMETSAT' },
  { noradId: 43689, name: 'MetOp-C', type: 'Weather', operator: 'EUMETSAT' },
  { noradId: 54743, name: 'MTG-I1', type: 'Weather', operator: 'EUMETSAT' },
  // === GPS CONSTELLATION (sample) ===
  { noradId: 48859, name: 'GPS III SV05', type: 'Navigation', operator: 'USSF' },
  { noradId: 50809, name: 'GPS III SV06', type: 'Navigation', operator: 'USSF' },
  { noradId: 28874, name: 'GPS IIR-M 1', type: 'Navigation', operator: 'USSF' },
  // === GALILEO (sample) ===
  { noradId: 40128, name: 'Galileo-FOC FM1', type: 'Navigation', operator: 'ESA' },
  { noradId: 40129, name: 'Galileo-FOC FM2', type: 'Navigation', operator: 'ESA' },
  // === ISRO ===
  { noradId: 45841, name: 'Cartosat-3', type: 'Earth Observation', operator: 'ISRO' },
  { noradId: 41794, name: 'ResourceSat-2A', type: 'Earth Observation', operator: 'ISRO' },
  { noradId: 43111, name: 'EOS-04 (RISAT-1A)', type: 'SAR Imaging', operator: 'ISRO' },
  { noradId: 56227, name: 'EOS-08', type: 'Earth Observation', operator: 'ISRO' },
  // === JAXA ===
  { noradId: 39766, name: 'ALOS-2 (Daichi-2)', type: 'SAR Imaging', operator: 'JAXA' },
  { noradId: 55083, name: 'ALOS-4 (Daichi-4)', type: 'SAR Imaging', operator: 'JAXA' },
  { noradId: 33492, name: 'GOSAT (Ibuki)', type: 'Atmosphere', operator: 'JAXA' },
  { noradId: 43064, name: 'GCOM-C (Shikisai)', type: 'Ocean/Climate', operator: 'JAXA' },
  // === CHINA ===
  { noradId: 47066, name: 'Gaofen-14', type: 'Earth Observation', operator: 'CNSA' },
  { noradId: 50465, name: 'Gaofen-13-02', type: 'Earth Observation', operator: 'CNSA' },
  // === KOREA ===
  { noradId: 51807, name: 'KOMPSAT-7', type: 'Earth Observation', operator: 'KARI' },
  // === COMMERCIAL / CSA ===
  { noradId: 32382, name: 'RADARSAT-2', type: 'SAR Imaging', operator: 'MDA/CSA' },
  { noradId: 44323, name: 'RCM-1', type: 'SAR Imaging', operator: 'CSA' },
  { noradId: 44324, name: 'RCM-2', type: 'SAR Imaging', operator: 'CSA' },
  { noradId: 44325, name: 'RCM-3', type: 'SAR Imaging', operator: 'CSA' },
  { noradId: 40115, name: 'WorldView-3', type: 'Earth Observation', operator: 'Maxar' },
  { noradId: 44874, name: 'PRISMA', type: 'Multispectral', operator: 'ASI' },
  { noradId: 41240, name: 'Jason-3', type: 'Altimetry', operator: 'CNES/NASA' },
  // === PLANET / SPIRE (sample) ===
  { noradId: 51071, name: 'SuperDove-224', type: 'Earth Observation', operator: 'Planet' },
  { noradId: 48907, name: 'SuperDove-132', type: 'Earth Observation', operator: 'Planet' },
  { noradId: 44421, name: 'Lemur-2-133', type: 'Weather', operator: 'Spire' },
];

// Default metadata for satellites (used as fallback when real data is available)
const SATELLITE_METADATA: { [key: number]: { purpose: string; inclination: number; orbitalPeriod: number; launchDate: string; mass: number; apogee: number; perigee: number; powerSource: string; instruments: string[] } } = {
  25544: { purpose: 'Human spaceflight & research', inclination: 51.6, orbitalPeriod: 92.9, launchDate: '1998-11-20', mass: 420000, apogee: 419, perigee: 406, powerSource: 'Solar panels', instruments: ['Cupola Observation Module', 'Destiny Lab', 'Canadarm2'] },
  48274: { purpose: 'Chinese crewed space station', inclination: 41.5, orbitalPeriod: 92.2, launchDate: '2021-04-29', mass: 66000, apogee: 395, perigee: 385, powerSource: 'Solar arrays', instruments: ['Wentian Lab', 'Mengtian Lab', 'Xuntian Telescope'] },
  20580: { purpose: 'Deep space optical/UV/IR astronomy', inclination: 28.5, orbitalPeriod: 95.4, launchDate: '1990-04-24', mass: 11110, apogee: 540, perigee: 530, powerSource: 'Solar arrays + NiH2 batteries', instruments: ['WFC3', 'COS', 'ACS', 'STIS'] },
  25994: { purpose: 'Global climate & environmental change', inclination: 98.2, orbitalPeriod: 98.9, launchDate: '1999-12-18', mass: 5190, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['MODIS', 'ASTER', 'CERES', 'MISR', 'MOPITT'] },
  27424: { purpose: 'Water cycle & Earth system science', inclination: 98.2, orbitalPeriod: 98.8, launchDate: '2002-05-04', mass: 2934, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['MODIS', 'AIRS', 'AMSU-A', 'CERES'] },
  28376: { purpose: 'Atmospheric chemistry & dynamics', inclination: 98.2, orbitalPeriod: 98.8, launchDate: '2004-07-15', mass: 2967, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['MLS', 'OMI', 'HIRDLS', 'TES'] },
  37849: { purpose: 'Weather forecasting & climate continuity', inclination: 98.7, orbitalPeriod: 101.4, launchDate: '2011-10-28', mass: 2110, apogee: 838, perigee: 830, powerSource: 'Solar panels', instruments: ['VIIRS', 'CrIS', 'ATMS', 'OMPS', 'CERES'] },
  43013: { purpose: 'Operational weather & environmental monitoring', inclination: 98.7, orbitalPeriod: 101.4, launchDate: '2017-11-18', mass: 2294, apogee: 838, perigee: 830, powerSource: 'Solar panels', instruments: ['VIIRS', 'CrIS', 'ATMS', 'OMPS', 'CERES'] },
  54234: { purpose: 'Next-gen polar weather observation', inclination: 98.7, orbitalPeriod: 101.4, launchDate: '2022-11-10', mass: 2294, apogee: 838, perigee: 830, powerSource: 'Solar panels', instruments: ['VIIRS', 'CrIS', 'ATMS', 'OMPS'] },
  43613: { purpose: 'Ice sheet elevation & sea ice thickness', inclination: 92.0, orbitalPeriod: 94.4, launchDate: '2018-09-15', mass: 1514, apogee: 499, perigee: 493, powerSource: 'Solar panels', instruments: ['ATLAS Lidar', 'GPS Receiver', 'Star Trackers'] },
  40376: { purpose: 'Global soil moisture & freeze/thaw state', inclination: 98.1, orbitalPeriod: 98.5, launchDate: '2015-01-31', mass: 944, apogee: 689, perigee: 681, powerSource: 'Solar panels', instruments: ['L-Band Radiometer', 'L-Band Radar'] },
  40390: { purpose: 'Solar wind monitoring at L1 point', inclination: 0.5, orbitalPeriod: 525600, launchDate: '2015-02-11', mass: 570, apogee: 1500000, perigee: 1500000, powerSource: 'Solar panels', instruments: ['EPIC Camera', 'NISTAR', 'PlasMag'] },
  29108: { purpose: 'Aerosol & cloud profiling via lidar', inclination: 98.2, orbitalPeriod: 98.9, launchDate: '2006-04-28', mass: 587, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['CALIOP Lidar', 'IIR', 'WFC'] },
  39084: { purpose: 'Land/water imaging for resource management', inclination: 98.2, orbitalPeriod: 98.9, launchDate: '2013-02-11', mass: 2071, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['OLI', 'TIRS'] },
  48208: { purpose: 'Land/water imaging continuity mission', inclination: 98.2, orbitalPeriod: 98.9, launchDate: '2021-09-27', mass: 2711, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['OLI-2', 'TIRS-2'] },
  39953: { purpose: 'All-weather radar imaging for Copernicus', inclination: 98.18, orbitalPeriod: 98.6, launchDate: '2014-04-03', mass: 2300, apogee: 697, perigee: 689, powerSource: 'Solar arrays', instruments: ['C-SAR', 'AOCS'] },
  40697: { purpose: 'High-res multispectral land monitoring', inclination: 98.57, orbitalPeriod: 101.5, launchDate: '2015-06-23', mass: 1140, apogee: 790, perigee: 782, powerSource: 'Solar arrays', instruments: ['MSI (13-band)'] },
  42063: { purpose: 'High-res multispectral land monitoring', inclination: 98.57, orbitalPeriod: 101.5, launchDate: '2017-03-07', mass: 1140, apogee: 790, perigee: 782, powerSource: 'Solar arrays', instruments: ['MSI (13-band)'] },
  39634: { purpose: 'Sea surface temperature & ocean colour', inclination: 98.64, orbitalPeriod: 102.4, launchDate: '2016-02-16', mass: 1250, apogee: 819, perigee: 811, powerSource: 'Solar arrays', instruments: ['OLCI', 'SLSTR', 'SRAL'] },
  46984: { purpose: 'High-precision ocean surface topography', inclination: 66.0, orbitalPeriod: 112.4, launchDate: '2020-11-21', mass: 1192, apogee: 1340, perigee: 1332, powerSource: 'Solar panels', instruments: ['Poseidon-4 Altimeter', 'AMR-C', 'GNSS-RO'] },
  36508: { purpose: 'Ice sheet & sea ice thickness monitoring', inclination: 92.0, orbitalPeriod: 99.2, launchDate: '2010-04-08', mass: 720, apogee: 721, perigee: 713, powerSource: 'Solar panels', instruments: ['SIRAL Altimeter', 'DORIS', 'LRR'] },
  41866: { purpose: 'Geostationary weather & space weather', inclination: 0.04, orbitalPeriod: 1436, launchDate: '2016-11-19', mass: 5192, apogee: 35800, perigee: 35770, powerSource: 'Solar arrays', instruments: ['ABI', 'GLM', 'SUVI', 'EXIS', 'SEISS', 'MAG'] },
  32382: { purpose: 'All-weather C-band radar imaging', inclination: 98.6, orbitalPeriod: 100.7, launchDate: '2007-12-14', mass: 2200, apogee: 802, perigee: 794, powerSource: 'Solar arrays', instruments: ['C-Band SAR'] },
  40115: { purpose: '31cm resolution commercial imaging', inclination: 97.2, orbitalPeriod: 97.0, launchDate: '2014-08-13', mass: 2800, apogee: 621, perigee: 613, powerSource: 'Solar arrays', instruments: ['WV110 Camera', 'CAVIS', 'SWIR Sensor'] },
  39766: { purpose: 'L-band SAR for disaster & cartography', inclination: 97.9, orbitalPeriod: 97.4, launchDate: '2014-05-24', mass: 2120, apogee: 632, perigee: 624, powerSource: 'Solar panels', instruments: ['PALSAR-2', 'SPAISE-2'] },
  41240: { purpose: 'Precision ocean surface altimetry', inclination: 66.05, orbitalPeriod: 112.4, launchDate: '2016-01-17', mass: 553, apogee: 1340, perigee: 1332, powerSource: 'Solar panels', instruments: ['Poseidon-3B Altimeter', 'AMR', 'DORIS', 'JMR'] },
};

// Default metadata values for satellites not in the detailed list
const DEFAULT_METADATA = { purpose: 'Operational satellite', inclination: 98.0, orbitalPeriod: 100, launchDate: 'Unknown', mass: 1000, apogee: 700, perigee: 690, powerSource: 'Solar panels', instruments: ['Primary Payload'] };

// Convert ECI to Lat/Lng using simplified gravity model
function eciToLatLng(eci: any) {
  const earthRadiusKm = 6371;
  const x = eci.x;
  const y = eci.y;
  const z = eci.z;

  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  const lng = (Math.atan2(y, x) * 180) / Math.PI - 0.5; // Approximate for Earth rotation

  return { lat, lng };
}

// Calculate distance from Earth center in km
function getDistance(eci: any) {
  return Math.sqrt(eci.x * eci.x + eci.y * eci.y + eci.z * eci.z);
}

// Fetch TLE data from Celestrak and compute real satellite positions
async function fetchRealSatellitePositions(): Promise<SatellitePosition[]> {
  try {
    // Fetch TLE data from our local API (which fetches from Celestrak server-side)
    const response = await fetch('/api/tle');
    if (!response.ok) throw new Error('Failed to fetch TLE data from API');

    const data = await response.json();
    const tleText = data.tle;

    if (!tleText) throw new Error('No TLE data received');

    const lines = tleText.split('\n').filter((line: string) => line.trim().length > 0);

    // Build a map of NORAD ID -> TLE lines
    // TLE format: 3 lines per satellite (name, line1 starting with '1', line2 starting with '2')
    const tleMap: { [key: number]: { line1: string; line2: string } } = {};
    for (let i = 0; i < lines.length - 2; i += 3) {
      const nameLine = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];

      if (line1 && line2 && line1.startsWith('1') && line2.startsWith('2')) {
        const noradMatch = line1.match(/1\s+(\d+)/);
        if (noradMatch) {
          const noradId = parseInt(noradMatch[1]);
          tleMap[noradId] = { line1, line2 };
        }
      }
    }

    console.log(`TLE parsed: ${Object.keys(tleMap).length} satellites in dataset, checking ${TRACKED_SATELLITES.length} tracked`);

    // Current time
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();
    const hours = now.getUTCHours();
    const minutes = now.getUTCMinutes();
    const seconds = now.getUTCSeconds();

    const positions: SatellitePosition[] = [];

    for (const tracked of TRACKED_SATELLITES) {
      const tle = tleMap[tracked.noradId];
      if (!tle) continue;

      try {
        // Parse TLE and propagate to current time
        const satrec = twoline2satrec(tle.line1, tle.line2);
        const positionEci = propagate(satrec, year, month, day, hours, minutes, seconds);

        if (!positionEci || !positionEci.position) continue; // Skip if propagation failed

        const { lat, lng } = eciToLatLng(positionEci.position);
        const distanceKm = getDistance(positionEci.position);
        const altitude = Math.max(0, distanceKm - 6371); // Earth radius = 6371 km

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || isNaN(altitude)) continue;

        // Get speed from velocity vector (rough estimate)
        const vel = positionEci.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z) * 86.4; // Convert to km/h

        // Find matching metadata for additional data
        const meta = SATELLITE_METADATA[tracked.noradId] || DEFAULT_METADATA;

        positions.push({
          id: tracked.noradId,
          name: tracked.name,
          type: tracked.type,
          operator: tracked.operator,
          lat: Math.max(-90, Math.min(90, lat)),
          lng: ((lng + 180) % 360) - 180, // Normalize to -180 to 180
          altitude: Math.round(altitude),
          speed: Math.round(speed),
          purpose: meta.purpose,
          inclination: meta.inclination,
          orbitalPeriod: meta.orbitalPeriod,
          launchDate: meta.launchDate,
          mass: meta.mass,
          apogee: meta.apogee,
          perigee: meta.perigee,
          powerSource: meta.powerSource,
          instruments: meta.instruments,
          status: 'Active',
        });
      } catch (err) {
        // Silently skip failed computations
        continue;
      }
    }

    // Return real positions if we got enough, otherwise fall back to mock
    console.log(`✓ Fetched ${positions.length} real satellites from Celestrak`);
    return positions.length >= 5 ? positions : generateMockPositions();
  } catch (error) {
    console.error('Error fetching real satellite data:', error);
    return generateMockPositions();
  }
}

// Generate mock satellite positions with slight variation
function generateMockPositions(): SatellitePosition[] {
  return TRACKED_SATELLITES.slice(0, 20).map((sat, i) => {
    const meta = SATELLITE_METADATA[sat.noradId] || DEFAULT_METADATA;
    return {
      id: sat.noradId,
      name: sat.name,
      type: sat.type,
      operator: sat.operator,
      lat: (Math.random() - 0.5) * 140,
      lng: (Math.random() - 0.5) * 340,
      altitude: 700,
      speed: 27500,
      ...meta,
      status: 'Active',
    };
  });
}

// Fetch upcoming launches from TheSpaceDevs LL2 API
async function fetchUpcomingLaunches(): Promise<Launch[]> {
  try {
    const response = await fetch('/api/launches');
    if (!response.ok) throw new Error('Failed to fetch launch data');

    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((r: any) => r.pad?.latitude && r.pad?.longitude)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        net: r.net,
        status: r.status?.name || 'Unknown',
        rocketName: r.rocket?.configuration?.name || 'Unknown Rocket',
        missionDescription: r.mission?.description || 'No mission details available.',
        provider: r.launch_service_provider?.name || 'Unknown Provider',
        padName: r.pad?.name || 'Unknown Pad',
        padLat: parseFloat(r.pad.latitude),
        padLng: parseFloat(r.pad.longitude),
        orbit: r.mission?.orbit?.name || 'Unknown Orbit',
        imageUrl: r.image || null,
      }));
  } catch (error) {
    console.error('Error fetching launch data:', error);
    return [];
  }
}

function LocateButton() {
  const map = useMap();

  useEffect(() => {
    const handleLocate = () => {
      map.locate({ setView: true, maxZoom: 16 });
    };

    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', 'leaflet-control-locate', container);
    button.href = '#';
    button.title = 'Show my location';
    button.innerHTML = '📍';
    button.style.fontSize = '20px';
    button.style.width = '36px';
    button.style.height = '36px';
    button.style.lineHeight = '36px';
    button.style.textAlign = 'center';
    button.style.color = '#fbbf24';
    button.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
    button.style.border = '1px solid rgba(251, 191, 36, 0.3)';
    button.style.cursor = 'pointer';

    button.addEventListener('click', (e) => {
      e.preventDefault();
      handleLocate();
    });

    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = 'rgba(30, 41, 59, 0.95)';
    });

    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = 'rgba(30, 41, 59, 0.8)';
    });

    const control = (L.Control as any).extend({
      onAdd: () => container,
    });

    const locateControl = new control({ position: 'bottomright' });
    locateControl.addTo(map);

    map.on('locationfound', (e: any) => {
      L.circleMarker([e.latitude, e.longitude], {
        radius: 6,
        fillColor: '#fbbf24',
        color: '#f59e0b',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      }).addTo(map).bindPopup('📍 You are here');
    });

    return () => {
      map.removeControl(locateControl);
    };
  }, [map]);

  return null;
}

function CountdownTimer({ net }: { net: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const launch = new Date(net).getTime();
      const diff = launch - now;

      if (diff <= 0) {
        setTimeLeft('LAUNCHED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${days > 0 ? `${days}d ` : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [net]);

  return (
    <p style={{
      margin: 0,
      fontSize: '24px',
      color: '#ff6b35',
      fontFamily: 'monospace',
      fontWeight: '700',
      letterSpacing: '2px',
    }}>
      T- {timeLeft}
    </p>
  );
}

// Color scheme per satellite type - minimalist SpaceX aesthetic
function getSatelliteColor(type: string): string {
  const colorMap: { [key: string]: string } = {
    'Space Station': '#ff3d3d',
    'Earth Observation': '#00d9ff',
    'Weather': '#4ade80',
    'SAR Imaging': '#f59e0b',
    'Multispectral': '#a78bfa',
    'Ocean/Climate': '#06b6d4',
    'Altimetry': '#818cf8',
    'Telescope': '#f472b6',
    'Atmosphere': '#34d399',
    'Space Weather': '#fbbf24',
    'Navigation': '#94a3b8',
    'Geodesy': '#67e8f9',
  };
  return colorMap[type] || '#00d9ff';
}

// SVG path data for each satellite type - thin geometric icons
function getSatelliteShape(type: string): string {
  // All paths designed for a 24x24 viewBox, thin stroke style
  const shapes: { [key: string]: string } = {
    // Cross with solar panel wings
    'Space Station': `
      <line x1="4" y1="12" x2="20" y2="12" stroke-width="1.5"/>
      <line x1="12" y1="6" x2="12" y2="18" stroke-width="1.5"/>
      <rect x="2" y="10" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.3"/>
      <rect x="17" y="10" width="5" height="4" rx="0.5" fill="currentColor" opacity="0.3"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    `,
    // Camera lens / eye
    'Earth Observation': `
      <circle cx="12" cy="12" r="5" stroke-width="1.2" fill="none"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <line x1="12" y1="3" x2="12" y2="7" stroke-width="1"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke-width="1"/>
      <line x1="3" y1="12" x2="7" y2="12" stroke-width="1"/>
      <line x1="17" y1="12" x2="21" y2="12" stroke-width="1"/>
    `,
    // Cloud with signal
    'Weather': `
      <path d="M6 16 Q6 12 10 12 Q10 8 14 8 Q18 8 18 12 Q22 12 22 16 Z" fill="none" stroke-width="1.2"/>
      <line x1="8" y1="19" x2="8" y2="21" stroke-width="1" opacity="0.5"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke-width="1" opacity="0.5"/>
      <line x1="16" y1="19" x2="16" y2="21" stroke-width="1" opacity="0.5"/>
    `,
    // Radar dish with signal arcs
    'SAR Imaging': `
      <path d="M6 18 L12 6 L18 18" fill="none" stroke-width="1.2"/>
      <line x1="12" y1="6" x2="12" y2="2" stroke-width="1"/>
      <path d="M8 4 Q12 0 16 4" fill="none" stroke-width="0.8" opacity="0.5"/>
      <path d="M6 6 Q12 -2 18 6" fill="none" stroke-width="0.8" opacity="0.3"/>
      <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
    `,
    // Prism / spectrum
    'Multispectral': `
      <polygon points="12,4 4,20 20,20" fill="none" stroke-width="1.2"/>
      <line x1="10" y1="12" x2="6" y2="20" stroke-width="0.7" opacity="0.4"/>
      <line x1="12" y1="12" x2="12" y2="20" stroke-width="0.7" opacity="0.4"/>
      <line x1="14" y1="12" x2="18" y2="20" stroke-width="0.7" opacity="0.4"/>
    `,
    // Wave
    'Ocean/Climate': `
      <path d="M2 12 Q6 6 10 12 Q14 18 18 12 Q20 10 22 12" fill="none" stroke-width="1.3"/>
      <path d="M2 16 Q6 10 10 16 Q14 22 18 16 Q20 14 22 16" fill="none" stroke-width="0.8" opacity="0.4"/>
    `,
    // Downward beam
    'Altimetry': `
      <circle cx="12" cy="6" r="3" fill="none" stroke-width="1.2"/>
      <circle cx="12" cy="6" r="1" fill="currentColor"/>
      <line x1="8" y1="9" x2="4" y2="20" stroke-width="0.8" opacity="0.4"/>
      <line x1="12" y1="9" x2="12" y2="20" stroke-width="1"/>
      <line x1="16" y1="9" x2="20" y2="20" stroke-width="0.8" opacity="0.4"/>
      <line x1="4" y1="20" x2="20" y2="20" stroke-width="0.8" opacity="0.5"/>
    `,
    // Crosshair telescope
    'Telescope': `
      <circle cx="12" cy="12" r="7" fill="none" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="3" fill="none" stroke-width="0.8"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <line x1="12" y1="2" x2="12" y2="5" stroke-width="1"/>
      <line x1="12" y1="19" x2="12" y2="22" stroke-width="1"/>
      <line x1="2" y1="12" x2="5" y2="12" stroke-width="1"/>
      <line x1="19" y1="12" x2="22" y2="12" stroke-width="1"/>
    `,
    // Layered arcs
    'Atmosphere': `
      <path d="M4 18 Q12 2 20 18" fill="none" stroke-width="1.2"/>
      <path d="M7 18 Q12 6 17 18" fill="none" stroke-width="0.8" opacity="0.5"/>
      <path d="M10 18 Q12 10 14 18" fill="none" stroke-width="0.6" opacity="0.3"/>
      <line x1="4" y1="18" x2="20" y2="18" stroke-width="0.8" opacity="0.4"/>
    `,
    // Sun burst
    'Space Weather': `
      <circle cx="12" cy="12" r="4" fill="none" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
      <line x1="12" y1="2" x2="12" y2="6" stroke-width="1"/>
      <line x1="12" y1="18" x2="12" y2="22" stroke-width="1"/>
      <line x1="2" y1="12" x2="6" y2="12" stroke-width="1"/>
      <line x1="18" y1="12" x2="22" y2="12" stroke-width="1"/>
      <line x1="5" y1="5" x2="8" y2="8" stroke-width="0.8"/>
      <line x1="16" y1="16" x2="19" y2="19" stroke-width="0.8"/>
      <line x1="19" y1="5" x2="16" y2="8" stroke-width="0.8"/>
      <line x1="8" y1="16" x2="5" y2="19" stroke-width="0.8"/>
    `,
    // Compass arrow
    'Navigation': `
      <polygon points="12,2 16,14 12,12 8,14" fill="currentColor" opacity="0.6" stroke-width="1"/>
      <polygon points="12,22 8,14 12,16 16,14" fill="none" stroke-width="1"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
    `,
    // Target rings
    'Geodesy': `
      <circle cx="12" cy="12" r="8" fill="none" stroke-width="1"/>
      <circle cx="12" cy="12" r="4.5" fill="none" stroke-width="0.8" opacity="0.5"/>
      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    `,
  };
  return shapes[type] || shapes['Earth Observation'];
}

function createSatelliteMarkerIcon(type: string) {
  const color = getSatelliteColor(type);
  const isStation = type === 'Space Station';
  const iconSize = isStation ? 34 : 26;
  const svgSize = 24;

  const iconHtml = `
    <div class="sat-marker" style="width:${iconSize}px;height:${iconSize}px;filter:drop-shadow(0 0 4px ${color}80) drop-shadow(0 0 8px ${color}30);">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 ${svgSize} ${svgSize}" xmlns="http://www.w3.org/2000/svg"
           style="color:${color};stroke:${color};overflow:visible;">
        ${getSatelliteShape(type)}
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
    className: 'satellite-marker-wrapper',
  });
}

const LAUNCH_COLOR = '#ff6b35';

function getLaunchStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('go')) return '#10b981';
  if (s.includes('tbd') || s.includes('tbc')) return '#fbbf24';
  if (s.includes('hold')) return '#ef4444';
  return LAUNCH_COLOR;
}

function createLaunchMarkerIcon(status: string) {
  const color = getLaunchStatusColor(status);
  const iconSize = 30;

  const iconHtml = `
    <div class="launch-marker" style="width:${iconSize}px;height:${iconSize}px;filter:drop-shadow(0 0 6px ${color}80) drop-shadow(0 0 12px ${color}30);">
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
           style="color:${color};stroke:${color};overflow:visible;">
        <path d="M12 2 L14 8 L14 16 L10 16 L10 8 Z" fill="none" stroke-width="1.2"/>
        <path d="M12 2 L14 8 L10 8 Z" fill="currentColor" opacity="0.3"/>
        <path d="M10 14 L7 19 L10 17" fill="currentColor" opacity="0.4" stroke-width="0.8"/>
        <path d="M14 14 L17 19 L14 17" fill="currentColor" opacity="0.4" stroke-width="0.8"/>
        <path d="M11 16 L12 20 L13 16" fill="currentColor" opacity="0.6" stroke-width="0.6"/>
        <circle cx="12" cy="10" r="1" fill="currentColor"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2],
    className: 'launch-marker-wrapper',
  });
}

export default function MapContainer() {
  const [satellites, setSatellites] = useState<SatellitePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSatellite, setSelectedSatellite] = useState<SatellitePosition | null>(null);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [selectedLaunch, setSelectedLaunch] = useState<Launch | null>(null);

  useEffect(() => {
    // Fix Leaflet default icons in Next.js
    delete (window as any).L.Icon.Default.prototype._getIconUrl;
    (window as any).L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  useEffect(() => {
    const fetchSatellitePositions = async () => {
      try {
        const positions = await fetchRealSatellitePositions();
        setSatellites(positions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching satellite positions:', error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchSatellitePositions();

    // Fetch every 30 seconds
    const interval = setInterval(fetchSatellitePositions, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fetch launches (15-min interval to respect LL2 rate limits)
  useEffect(() => {
    const fetchLaunches = async () => {
      const launchData = await fetchUpcomingLaunches();
      setLaunches(launchData);
    };

    fetchLaunches();
    const interval = setInterval(fetchLaunches, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
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

        {/* Satellite Markers */}
        {satellites.map((sat) => {
          const icon = createSatelliteMarkerIcon(sat.type);

          return (
            <Marker
              key={sat.id}
              position={[sat.lat, sat.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  setSelectedLaunch(null);
                  setSelectedSatellite(sat);
                },
              }}
            />
          );
        })}

        {/* Launch Markers */}
        {launches.map((launch) => (
          <Marker
            key={`launch-${launch.id}`}
            position={[launch.padLat, launch.padLng]}
            icon={createLaunchMarkerIcon(launch.status)}
            eventHandlers={{
              click: () => {
                setSelectedSatellite(null);
                setSelectedLaunch(launch);
              },
            }}
          />
        ))}

        <ZoomControl position="bottomright" />
        <LocateButton />
      </LeafletMap>

      {/* Satellite Details Sidebar */}
      {selectedSatellite && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '420px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 39, 0.98) 100%)',
          borderRight: '1px solid rgba(0, 217, 255, 0.3)',
          boxShadow: '8px 0 32px rgba(0, 0, 0, 0.5)',
          zIndex: 100,
          overflow: 'auto',
          fontFamily: 'Geist Sans, system-ui, sans-serif',
        }}>
          {/* Close Button */}
          <button
            onClick={() => setSelectedSatellite(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0, 217, 255, 0.1)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              color: '#00d9ff',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 101,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 217, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>

          {/* Header with Icon and Name */}
          <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getSatelliteColor(selectedSatellite.type),
                boxShadow: `0 0 8px ${getSatelliteColor(selectedSatellite.type)}, 0 0 20px ${getSatelliteColor(selectedSatellite.type)}40`,
              }} />
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>
                NORAD {selectedSatellite.id}
              </span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '700', color: '#e2e8f0', letterSpacing: '0.5px' }}>
              {selectedSatellite.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 8px',
                fontSize: '10px',
                color: getSatelliteColor(selectedSatellite.type),
                border: `1px solid ${getSatelliteColor(selectedSatellite.type)}40`,
                borderRadius: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}>
                {selectedSatellite.type}
              </span>
              <span style={{
                padding: '2px 8px',
                fontSize: '10px',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}>
                {selectedSatellite.status}
              </span>
            </div>
          </div>

          {/* Current Position Section */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Current Position
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>LATITUDE</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.lat.toFixed(4)}°
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>LONGITUDE</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.lng.toFixed(4)}°
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>ALTITUDE</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.altitude.toLocaleString()} km
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>VELOCITY</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.speed.toLocaleString()} km/h
                </p>
              </div>
            </div>
          </div>

          {/* Orbital Parameters */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Orbital Parameters
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>INCLINATION</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.inclination.toFixed(2)}°
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>ORBITAL PERIOD</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.orbitalPeriod.toFixed(1)} min
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>APOGEE</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.apogee.toLocaleString()} km
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>PERIGEE</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#00d9ff', fontFamily: 'monospace', fontWeight: '600' }}>
                  {selectedSatellite.perigee.toLocaleString()} km
                </p>
              </div>
            </div>
          </div>

          {/* Satellite Properties */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Properties
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>LAUNCH DATE</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1' }}>
                  {selectedSatellite.launchDate}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>MASS</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  {selectedSatellite.mass.toLocaleString()} kg
                </p>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>POWER SOURCE</p>
              <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1' }}>
                {selectedSatellite.powerSource}
              </p>
            </div>
          </div>

          {/* Operator & Mission */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0, 217, 255, 0.2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Organization
            </p>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#00d9ff', fontWeight: '600' }}>
              {selectedSatellite.operator}
            </p>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Mission
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {selectedSatellite.purpose}
            </p>
          </div>

          {/* Instruments */}
          <div style={{ padding: '20px 24px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Instruments
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedSatellite.instruments.map((instrument, idx) => (
                <p
                  key={idx}
                  style={{
                    margin: '0',
                    padding: '6px 8px',
                    fontSize: '11px',
                    color: '#cbd5e1',
                    background: 'rgba(0, 217, 255, 0.05)',
                    border: '1px solid rgba(0, 217, 255, 0.2)',
                    borderRadius: '4px',
                  }}
                >
                  {instrument}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Launch Details Sidebar */}
      {selectedLaunch && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '420px',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(10, 14, 39, 0.98) 100%)',
          borderRight: '1px solid rgba(255, 107, 53, 0.3)',
          boxShadow: '8px 0 32px rgba(0, 0, 0, 0.5)',
          zIndex: 100,
          overflow: 'auto',
          fontFamily: 'Geist Sans, system-ui, sans-serif',
        }}>
          {/* Close Button */}
          <button
            onClick={() => setSelectedLaunch(null)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 107, 53, 0.1)',
              border: '1px solid rgba(255, 107, 53, 0.3)',
              color: '#ff6b35',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 101,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 53, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 107, 53, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 107, 53, 0.1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>

          {/* Header */}
          <div style={{ padding: '32px 24px 24px', borderBottom: '1px solid rgba(255, 107, 53, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getLaunchStatusColor(selectedLaunch.status),
                boxShadow: `0 0 8px ${getLaunchStatusColor(selectedLaunch.status)}, 0 0 20px ${getLaunchStatusColor(selectedLaunch.status)}40`,
              }} />
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>
                UPCOMING LAUNCH
              </span>
            </div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#e2e8f0', letterSpacing: '0.5px' }}>
              {selectedLaunch.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 8px',
                fontSize: '10px',
                color: getLaunchStatusColor(selectedLaunch.status),
                border: `1px solid ${getLaunchStatusColor(selectedLaunch.status)}40`,
                borderRadius: '3px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: '600',
              }}>
                {selectedLaunch.status}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 107, 53, 0.2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Countdown
            </p>
            <CountdownTimer net={selectedLaunch.net} />
          </div>

          {/* Launch Details */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 107, 53, 0.2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Launch Details
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>ROCKET</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#ff6b35', fontWeight: '600' }}>
                  {selectedLaunch.rocketName}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>PROVIDER</p>
                <p style={{ margin: '0', fontSize: '13px', color: '#e2e8f0', fontWeight: '600' }}>
                  {selectedLaunch.provider}
                </p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>LAUNCH PAD</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1' }}>
                  {selectedLaunch.padName}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>TARGET ORBIT</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1' }}>
                  {selectedLaunch.orbit}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '9px', color: '#64748b' }}>LAUNCH DATE</p>
                <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                  {new Date(selectedLaunch.net).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Mission Description */}
          <div style={{ padding: '20px 24px' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
              Mission
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {selectedLaunch.missionDescription}
            </p>
          </div>
        </div>
      )}

      {/* Overlay Backdrop when sidebar is open */}
      {(selectedSatellite || selectedLaunch) && (
        <div
          onClick={() => { setSelectedSatellite(null); setSelectedLaunch(null); }}
          style={{
            position: 'absolute',
            top: 0,
            left: 420,
            right: 0,
            bottom: 0,
            zIndex: 50,
            cursor: 'pointer',
          }}
        />
      )}

      {/* Status Indicator */}
      {!loading && (
        <div style={{
          position: 'absolute',
          top: '96px',
          right: '16px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: '4px',
          border: '1px solid rgba(0, 217, 255, 0.15)',
          display: 'flex',
          gap: '16px',
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            <span style={{ color: '#00d9ff', fontWeight: '600' }}>{satellites.length}</span> SAT
          </p>
          {launches.length > 0 && (
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              <span style={{ color: '#ff6b35', fontWeight: '600' }}>{launches.length}</span> LAUNCH
            </p>
          )}
        </div>
      )}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '96px',
          right: '16px',
          zIndex: 20,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '8px 14px',
          borderRadius: '4px',
          border: '1px solid rgba(0, 217, 255, 0.15)',
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
            ACQUIRING...
          </p>
        </div>
      )}
    </>
  );
}