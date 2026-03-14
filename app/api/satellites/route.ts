import { NextRequest, NextResponse } from 'next/server';

// Mock satellite data with detailed information
const MOCK_SATELLITES = [
  { id: 25544, name: 'ISS (ZARYA)', type: 'Space Station', operator: 'NASA/ESA/Roscosmos', lat: 51.6416, lng: -54.0653, altitude: 408, speed: 27600, purpose: 'Human spaceflight & research', inclination: 51.6, orbitalPeriod: 92.9, launchDate: '1998-11-20', mass: 420000, apogee: 419, perigee: 406, powerSource: 'Solar panels', instruments: ['Cupola Observation Module', 'Destiny Lab Module', 'MBS Solar Arrays', 'Canadarm2'], status: 'Active' },
  { id: 39084, name: 'Landsat 8', type: 'Earth Observation', operator: 'USGS/NASA', lat: -12.3456, lng: 89.7654, altitude: 705, speed: 27500, purpose: 'Land/water imaging', inclination: 98.2, orbitalPeriod: 98.9, launchDate: '2013-02-11', mass: 2140, apogee: 709, perigee: 701, powerSource: 'Solar panels + battery', instruments: ['OLI', 'TIRS', 'MSS'], status: 'Active' },
  { id: 48208, name: 'Landsat 9', type: 'Earth Observation', operator: 'USGS/NASA', lat: 35.2109, lng: 120.5678, altitude: 705, speed: 27500, purpose: 'Land/water imaging', inclination: 98.2, orbitalPeriod: 98.9, launchDate: '2021-09-27', mass: 2180, apogee: 709, perigee: 701, powerSource: 'Solar panels', instruments: ['OLI-2', 'TIRS-2'], status: 'Active' },
  { id: 39953, name: 'Sentinel-1A', type: 'SAR Imaging', operator: 'ESA', lat: -45.6789, lng: 170.1234, altitude: 693, speed: 27500, purpose: 'Radar imaging, disaster monitoring', inclination: 98.18, orbitalPeriod: 98.6, launchDate: '2014-04-03', mass: 2250, apogee: 697, perigee: 689, powerSource: 'Solar arrays', instruments: ['C-SAR', 'AOCS'], status: 'Active' },
  { id: 41456, name: 'Sentinel-1B', type: 'SAR Imaging', operator: 'ESA', lat: 22.3456, lng: -95.7890, altitude: 693, speed: 27500, purpose: 'Radar imaging, disaster monitoring', inclination: 98.18, orbitalPeriod: 98.6, launchDate: '2016-04-25', mass: 2280, apogee: 697, perigee: 689, powerSource: 'Solar arrays', instruments: ['C-SAR', 'AOCS'], status: 'Active' },
  { id: 40697, name: 'Sentinel-2A', type: 'Multispectral', operator: 'ESA', lat: 10.9876, lng: 105.4321, altitude: 786, speed: 27500, purpose: 'Agricultural & vegetation monitoring', inclination: 98.57, orbitalPeriod: 101.5, launchDate: '2015-06-23', mass: 1180, apogee: 790, perigee: 782, powerSource: 'Solar arrays', instruments: ['MSI'], status: 'Active' },
  { id: 42063, name: 'Sentinel-2B', type: 'Multispectral', operator: 'ESA', lat: -30.5432, lng: 145.6789, altitude: 786, speed: 27500, purpose: 'Agricultural & vegetation monitoring', inclination: 98.57, orbitalPeriod: 101.5, launchDate: '2017-03-07', mass: 1180, apogee: 790, perigee: 782, powerSource: 'Solar arrays', instruments: ['MSI'], status: 'Active' },
  { id: 39634, name: 'Sentinel-3A', type: 'Ocean/Climate', operator: 'ESA', lat: 65.4321, lng: -20.9876, altitude: 815, speed: 26700, purpose: 'Sea surface temperature & ocean color', inclination: 98.64, orbitalPeriod: 102.4, launchDate: '2016-02-16', mass: 1255, apogee: 819, perigee: 811, powerSource: 'Solar arrays', instruments: ['OLCI', 'SLSTR', 'SRAL'], status: 'Active' },
  { id: 43013, name: 'Sentinel-3B', type: 'Ocean/Climate', operator: 'ESA', lat: 5.6789, lng: 30.1234, altitude: 815, speed: 26700, purpose: 'Sea surface temperature & ocean color', inclination: 98.64, orbitalPeriod: 102.4, launchDate: '2018-04-25', mass: 1327, apogee: 819, perigee: 811, powerSource: 'Solar arrays', instruments: ['OLCI', 'SLSTR', 'SRAL'], status: 'Active' },
  { id: 45381, name: 'Cartosat-2E', type: 'Earth Observation', operator: 'ISRO', lat: 20.5937, lng: 78.9629, altitude: 618, speed: 27500, purpose: 'High-resolution cartography', inclination: 97.4, orbitalPeriod: 96.8, launchDate: '2017-04-10', mass: 712, apogee: 621, perigee: 615, powerSource: 'Solar panels', instruments: ['PAN Camera', 'Multi-spectral sensor'], status: 'Active' },
  { id: 45841, name: 'Cartosat-3', type: 'Earth Observation', operator: 'ISRO', lat: 15.3456, lng: 73.8765, altitude: 509, speed: 27800, purpose: '1m resolution imaging satellite', inclination: 97.45, orbitalPeriod: 94.1, launchDate: '2019-11-27', mass: 1625, apogee: 512, perigee: 506, powerSource: 'Solar arrays', instruments: ['1m Panchromatic', 'Multispectral'], status: 'Active' },
  { id: 41794, name: 'ResourceSat-2A', type: 'Earth Observation', operator: 'ISRO', lat: 25.1234, lng: 82.5678, altitude: 822, speed: 26800, purpose: 'Natural resource management', inclination: 99.0, orbitalPeriod: 103.2, launchDate: '2011-12-20', mass: 2268, apogee: 826, perigee: 818, powerSource: 'Solar panels', instruments: ['LISS-3', 'AWiFS'], status: 'Active' },
  { id: 28654, name: 'NOAA 18', type: 'Weather', operator: 'NOAA', lat: -60.7890, lng: 45.6789, altitude: 870, speed: 26300, purpose: 'Weather forecasting & climate monitoring', inclination: 99.0, orbitalPeriod: 102.1, launchDate: '2005-05-20', mass: 2500, apogee: 874, perigee: 866, powerSource: 'Solar panels + battery', instruments: ['AVHRR', 'MHS', 'AMSU-A'], status: 'Active' },
  { id: 33591, name: 'NOAA 19', type: 'Weather', operator: 'NOAA', lat: 40.5432, lng: -75.1234, altitude: 870, speed: 26300, purpose: 'Weather forecasting & climate monitoring', inclination: 99.0, orbitalPeriod: 102.1, launchDate: '2009-06-18', mass: 2500, apogee: 874, perigee: 866, powerSource: 'Solar panels + battery', instruments: ['AVHRR', 'MHS', 'AMSU-A'], status: 'Active' },
  { id: 37348, name: 'SPOT-7', type: 'Earth Observation', operator: 'Airbus DS', lat: 12.9876, lng: 60.5432, altitude: 822, speed: 26700, purpose: 'Multispectral Earth imaging', inclination: 98.65, orbitalPeriod: 101.7, launchDate: '2014-06-30', mass: 712, apogee: 826, perigee: 818, powerSource: 'Solar arrays', instruments: ['Panchromatic', 'Multispectral', 'Infrared'], status: 'Active' },
  { id: 39709, name: 'SPOT-6', type: 'Earth Observation', operator: 'Airbus DS', lat: -18.3456, lng: 115.6789, altitude: 822, speed: 26700, purpose: 'Multispectral Earth imaging', inclination: 98.65, orbitalPeriod: 101.7, launchDate: '2012-09-09', mass: 712, apogee: 826, perigee: 818, powerSource: 'Solar arrays', instruments: ['Panchromatic', 'Multispectral', 'Infrared'], status: 'Active' },
  { id: 38833, name: 'IceSat-2', type: 'Altimetry', operator: 'NASA', lat: 72.1234, lng: -45.6789, altitude: 496, speed: 27900, purpose: 'Ice sheet & atmosphere measurement', inclination: 92.0, orbitalPeriod: 94.4, launchDate: '2018-09-15', mass: 1200, apogee: 499, perigee: 493, powerSource: 'Solar panels', instruments: ['ATLAS Lidar', 'Precision Positioning'], status: 'Active' },
  { id: 44713, name: 'ICEYE-X1', type: 'SAR Imaging', operator: 'ICEYE', lat: 35.6789, lng: 140.1234, altitude: 630, speed: 27400, purpose: 'Synthetic aperture radar imaging', inclination: 97.43, orbitalPeriod: 97.5, launchDate: '2018-01-02', mass: 70, apogee: 633, perigee: 627, powerSource: 'Solar arrays', instruments: ['SAR Antenna'], status: 'Active' },
  { id: 45856, name: 'Radarsat-2', type: 'SAR Imaging', operator: 'CSA', lat: 55.4321, lng: -110.9876, altitude: 798, speed: 26900, purpose: 'All-weather radar imaging', inclination: 98.6, orbitalPeriod: 100.7, launchDate: '2007-12-14', mass: 2300, apogee: 802, perigee: 794, powerSource: 'Solar arrays + battery', instruments: ['C-Band SAR'], status: 'Active' },
  { id: 39444, name: 'Oceansat-2', type: 'Ocean Monitoring', operator: 'ISRO', lat: 8.765, lng: -35.4321, altitude: 720, speed: 27400, purpose: 'Oceanographic data collection', inclination: 98.37, orbitalPeriod: 100.3, launchDate: '2009-09-23', mass: 960, apogee: 724, perigee: 716, powerSource: 'Solar panels', instruments: ['OCM', 'OSCAT', 'SCAT'], status: 'Active' },
];

export async function GET(request: NextRequest) {
  try {
    // Return mock satellite data
    const positions = MOCK_SATELLITES.map(sat => ({
      id: sat.id,
      name: sat.name,
      type: sat.type,
      operator: sat.operator,
      lat: sat.lat + (Math.random() - 0.5) * 2,
      lng: sat.lng + (Math.random() - 0.5) * 2,
      altitude: sat.altitude,
      speed: sat.speed,
      purpose: sat.purpose,
      inclination: sat.inclination,
      orbitalPeriod: sat.orbitalPeriod,
      launchDate: sat.launchDate,
      mass: sat.mass,
      apogee: sat.apogee,
      perigee: sat.perigee,
      powerSource: sat.powerSource,
      instruments: sat.instruments,
      status: sat.status,
    }));

    return NextResponse.json(positions);
  } catch (error) {
    console.error('Error fetching satellites:', error);
    return NextResponse.json([], { status: 500 });
  }
}

