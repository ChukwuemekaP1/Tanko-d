import { useState, useCallback } from 'react';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(async () => {
    setError(null);
    setLoading(true);

    if (!Capacitor.isNativePlatform()) {
      // Fallback to browser geolocation
      return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
        if (!navigator.geolocation) {
          const err = 'Geolocation is not supported by this browser';
          setError(err);
          setLoading(false);
          reject(new Error(err));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setLocation(coords);
            setLoading(false);
            resolve(coords);
          },
          (err) => {
            let message = 'Error getting location';
            if (err.code === err.PERMISSION_DENIED) message = 'Permission denied';
            else if (err.code === err.POSITION_UNAVAILABLE) message = 'Position unavailable';
            else if (err.code === err.TIMEOUT) message = 'Location request timed out';
            
            setError(message);
            setLoading(false);
            reject(new Error(message));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    }

    try {
      const permissions = await Geolocation.checkPermissions();
      
      if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
        const request = await Geolocation.requestPermissions();
        if (request.location !== 'granted' && request.coarseLocation !== 'granted') {
          throw new Error('Geolocation permission denied');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000, // Slightly longer timeout for native
        maximumAge: 0
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setLocation(coords);
      setLoading(false);
      return coords;
    } catch (err: any) {
      let message = err.message || 'Failed to get location';
      if (message.includes('denied')) message = 'Permission denied';
      
      setError(message);
      setLoading(false);
      throw new Error(message);
    }
  }, []);

  return { location, error, loading, getLocation };
}
