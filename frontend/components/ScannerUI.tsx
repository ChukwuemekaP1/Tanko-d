'use client'

import { X, Zap, ZapOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Capacitor } from '@capacitor/core'

interface ScannerUIProps {
  onStop: () => void;
}

export function ScannerUI({ onStop }: ScannerUIProps) {
  const isNative = Capacitor.isNativePlatform();

  return (
    <div className="scanner-ui fixed inset-0 z-[100] flex flex-col bg-black/50 backdrop-blur-sm">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!isNative ? (
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div id="reader" className="w-full"></div>
            <div className="p-4 text-center">
              <p className="text-gray-600 text-sm">
                Coloca el código QR frente a la cámara
              </p>
            </div>
          </div>
        ) : (
          <div className="relative w-64 h-64 border-2 border-white/50 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-500/50 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          </div>
        )}
        
        {isNative && (
          <p className="mt-8 text-white text-lg font-medium drop-shadow-lg pointer-events-none">
            Escanea el código QR de la estación
          </p>
        )}
      </div>

      <div className="p-8 pb-12 flex justify-center">
        <Button
          variant="secondary"
          size="lg"
          className="rounded-full bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/30"
          onClick={onStop}
        >
          <X className="mr-2 h-5 w-5" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
