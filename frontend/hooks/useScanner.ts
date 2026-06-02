import { useState } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';

export function useScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      setError('Barcode scanning is only available on native mobile devices.');
      return null;
    }

    try {
      // Check permissions
      const status = await BarcodeScanner.checkPermission({ force: true });
      if (!status.granted) {
        throw new Error('Camera permission denied');
      }

      // Hide webview background for transparency
      BarcodeScanner.hideBackground();
      document.body.classList.add('scanner-active');
      setIsScanning(true);

      const result = await BarcodeScanner.startScan();
      
      stopScan();

      if (result.hasContent) {
        return result.content;
      }
      return null;
    } catch (err: any) {
      stopScan();
      setError(err.message);
      throw err;
    }
  };

  const stopScan = () => {
    if (Capacitor.isNativePlatform()) {
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    }
    document.body.classList.remove('scanner-active');
    setIsScanning(false);
  };

  return { startScan, stopScan, isScanning, error };
}
