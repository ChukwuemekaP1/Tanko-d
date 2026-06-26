'use client'

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export function useDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const handleDeepLink = (data: { url: string }) => {
      const slug = data.url.split('://').pop();
      if (slug) {
        router.push(`/${slug}`);
      }
    };

    const setup = async () => {
      try {
        await App.addListener('appUrlOpen', handleDeepLink);

        const launch = await App.getLaunchUrl();
        if (!cancelled && launch?.url) {
          handleDeepLink({ url: launch.url });
        }
      } catch {
        // Capacitor plugins are not available in the browser build.
      }
    };

    void setup();

    return () => {
      cancelled = true;
      void App.removeAllListeners();
    };
  }, [router]);
}
