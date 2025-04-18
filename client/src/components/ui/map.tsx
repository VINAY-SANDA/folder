import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface MapProps {
  latitude: number;
  longitude: number;
  markers?: Array<{
    id: number;
    lat: number;
    lng: number;
    title: string;
    isFeatured?: boolean;
  }>;
  onMarkerClick?: (id: number) => void;
  height?: string;
  zoom?: number;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function Map({ 
  latitude, 
  longitude, 
  markers = [], 
  onMarkerClick,
  height = '500px',
  zoom = 14
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [map, setMap] = useState<any>(null);
  const googleMapRef = useRef<any>(null);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&callback=initMap`;
    script.async = true;
    script.defer = true;

    window.initMap = () => {
      setMapLoaded(true);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup function
      window.initMap = () => {};
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Create the map instance
    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      zoom: zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);
    googleMapRef.current = newMap;

    // Add user location marker
    new window.google.maps.Marker({
      position: { lat: latitude, lng: longitude },
      map: newMap,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Your location",
    });

  }, [mapLoaded, latitude, longitude, zoom]);

  useEffect(() => {
    if (!map || !markers.length) return;

    // Clear existing markers
    if (googleMapRef.current?.markers) {
      googleMapRef.current.markers.forEach((marker: any) => {
        marker.setMap(null);
      });
    }

    // Create new array for markers
    const mapMarkers: any[] = [];

    // Add markers for food listings
    markers.forEach(marker => {
      if (!marker.lat || !marker.lng) return;

      const markerColor = marker.isFeatured ? "#FF9800" : "#4CAF50";

      const newMarker = new window.google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map: map,
        title: marker.title,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });

      if (onMarkerClick) {
        newMarker.addListener("click", () => {
          onMarkerClick(marker.id);
        });
      }

      mapMarkers.push(newMarker);
    });

    // Store markers reference
    googleMapRef.current.markers = mapMarkers;

  }, [map, markers, onMarkerClick]);

  return (
    <Card className="relative overflow-hidden">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
          <div className="text-center">
            <span className="material-icons text-5xl text-neutral-400">map</span>
            <p className="mt-2 text-neutral-500">Loading map...</p>
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="bg-neutral-100"
      />
      {mapLoaded && map && (
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button 
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
            onClick={() => map.setZoom(map.getZoom() + 1)}
          >
            <span className="material-icons">add</span>
          </button>
          <button 
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
            onClick={() => map.setZoom(map.getZoom() - 1)}
          >
            <span className="material-icons">remove</span>
          </button>
          <button 
            className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center"
            onClick={() => map.setCenter({ lat: latitude, lng: longitude })}
          >
            <span className="material-icons">my_location</span>
          </button>
        </div>
      )}
    </Card>
  );
}
