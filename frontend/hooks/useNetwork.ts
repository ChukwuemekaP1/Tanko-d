import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useNetwork() {
  const [status, setStatus] = useState<ConnectionStatus | { connected: boolean; connectionType: string }>({
    connected: true,
    connectionType: 'wifi'
  });

  useEffect(() => {
    let handler: any;

    const checkStatus = async () => {
      if (Capacitor.isNativePlatform()) {
        const currentStatus = await Network.getStatus();
        setStatus(currentStatus);
        
        handler = await Network.addListener('networkStatusChange', (newStatus) => {
          setStatus(newStatus);
        });
      } else {
        // Browser fallback
        setStatus({
          connected: navigator.onLine,
          connectionType: 'unknown'
        });

        const onOnline = () => setStatus({ connected: true, connectionType: 'unknown' });
        const onOffline = () => setStatus({ connected: false, connectionType: 'unknown' });

        window.addEventListener('online', onOnline);
        window.addEventListener('offline', onOffline);

        return () => {
          window.removeEventListener('online', onOnline);
          window.removeEventListener('offline', onOffline);
        };
      }
    };

    checkStatus();

    return () => {
      if (handler) {
        handler.remove();
      }
    };
  }, []);

  return status;
}
