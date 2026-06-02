import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useNetwork() {
  const [status, setStatus] = useState<ConnectionStatus & { isOnline: boolean }>({
    connected: true,
    connectionType: 'wifi',
    isOnline: true
  });

  useEffect(() => {
    let handler: any;

    const checkStatus = async () => {
      if (Capacitor.isNativePlatform()) {
        const currentStatus = await Network.getStatus();
        setStatus({
          ...currentStatus,
          isOnline: currentStatus.connected
        });
        
        handler = await Network.addListener('networkStatusChange', (newStatus) => {
          setStatus({
            ...newStatus,
            isOnline: newStatus.connected
          });
        });
      } else {
        // Browser fallback
        const updateBrowserStatus = () => {
          setStatus({
            connected: navigator.onLine,
            connectionType: (navigator as any).connection?.type || 'unknown',
            isOnline: navigator.onLine
          });
        };

        updateBrowserStatus();

        window.addEventListener('online', updateBrowserStatus);
        window.addEventListener('offline', updateBrowserStatus);

        return () => {
          window.removeEventListener('online', updateBrowserStatus);
          window.removeEventListener('offline', updateBrowserStatus);
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
