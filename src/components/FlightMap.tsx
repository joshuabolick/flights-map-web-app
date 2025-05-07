import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Create custom plane icon
const createPlaneIcon = (heading: number) => {
  return L.divIcon({
    className: 'custom-plane-icon',
    html: `
      <div style="
        transform: rotate(${heading}deg);
        width: 20px;
        height: 20px;
        position: relative;
      ">
        <svg viewBox="0 0 24 24" style="
          width: 100%;
          height: 100%;
          fill: #007bff;
        ">
          <path d="M21,16V14L13,9V3.5C13,2.67 12.33,2 11.5,2C10.67,2 10,2.67 10,3.5V9L2,14V16L10,13.5V19L8,20.5L8,22L11.5,21L15,22L15,20.5L13,19V13.5L21,16Z" />
        </svg>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface Flight {
  icao24: string;
  callsign: string;
  origin_country: string;
  longitude: number;
  latitude: number;
  altitude: number;
  velocity: number;
  heading: number;
}

const isValidCoordinate = (lat: number | null, lng: number | null): boolean => {
  return (
    lat !== null &&
    lng !== null &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

const FlightMap = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFlights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('https://opensky-network.org/api/states/all');
      if (response.data && response.data.states) {
        const allFlights = response.data.states
          .map((state: any) => ({
            icao24: state[0],
            callsign: state[1]?.trim() || 'Unknown',
            origin_country: state[2] || 'Unknown',
            longitude: state[5],
            latitude: state[6],
            altitude: state[7] || 0,
            velocity: state[9] || 0,
            heading: state[10] || 0,
          }))
          .filter((flight: Flight) => 
            isValidCoordinate(flight.latitude, flight.longitude)
          );

        setFlights(allFlights);
      }
    } catch (error) {
      console.error('Error fetching flight data:', error);
      setError('Failed to fetch flight data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  const renderMarkers = useCallback(() => {
    return flights.map((flight) => (
      <Marker
        key={flight.icao24}
        position={[flight.latitude, flight.longitude]}
        icon={createPlaneIcon(flight.heading)}
      >
        <Popup>
          <div>
            <h3>Flight Information</h3>
            <p>Callsign: {flight.callsign}</p>
            <p>Country: {flight.origin_country}</p>
            <p>Altitude: {Math.round(flight.altitude)} m</p>
            <p>Speed: {Math.round(flight.velocity * 1.94384)} knots</p>
            <p>Heading: {Math.round(flight.heading)}°</p>
          </div>
        </Popup>
      </Marker>
    ));
  }, [flights]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="map-container">
      <div className="controls">
        <button 
          className="refresh-button"
          onClick={fetchFlights}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      <MapContainer
        center={[20, 0]} // Center of world map
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
        >
          {renderMarkers()}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default FlightMap; 