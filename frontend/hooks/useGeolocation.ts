import { useState, useEffect } from 'react';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to browser geolocation
      return new Promise((resolve, reject) => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(coords);
            setLoading(false);
            resolve(coords);
          },
          (err) => {
            setError(err.message);
            setLoading(false);
            reject(err);
          },
          { enableHighAccuracy: true }
        );
      });
    }

    try {
      setLoading(true);
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted') {
          throw new Error('Geolocation permission denied');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setLocation(coords);
      setLoading(false);
      return coords;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { location, error, loading, getLocation };
}
