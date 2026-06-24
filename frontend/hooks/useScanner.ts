import { useState, useCallback } from 'react';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { Capacitor } from '@capacitor/core';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export function useScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webScanner, setWebScanner] = useState<any>(null);

  const startScan = useCallback(async () => {
    setError(null);

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await BarcodeScanner.checkPermission({ force: true });
        if (!status.granted) {
          throw new Error('Camera permission denied');
        }

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
    } else {
      // Web implementation
      return new Promise<string | null>((resolve, reject) => {
        setIsScanning(true);
        
        // We need a div with id="reader" in the DOM
        const scanner = new Html5QrcodeScanner(
          "reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
          },
          /* verbose= */ false
        );

        setWebScanner(scanner);

        scanner.render(
          (decodedText) => {
            scanner.clear();
            setIsScanning(false);
            setWebScanner(null);
            resolve(decodedText);
          },
          (errorMessage) => {
            // Silently ignore errors during scanning (e.g. "QR code not found")
          }
        );

        // Handle manual stop/cancel
        window.addEventListener('stop-web-scanner', () => {
          scanner.clear();
          setIsScanning(false);
          setWebScanner(null);
          resolve(null);
        }, { once: true });
      });
    }
  }, []);

  const stopScan = useCallback(() => {
    if (Capacitor.isNativePlatform()) {
      BarcodeScanner.showBackground();
      BarcodeScanner.stopScan();
    } else {
      window.dispatchEvent(new CustomEvent('stop-web-scanner'));
    }
    document.body.classList.remove('scanner-active');
    setIsScanning(false);
  }, []);

  return { startScan, stopScan, isScanning, error };
}
