'use client'

import { useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export function useDeepLinks() {
  const router = useRouter();

  const handleDeepLink = useCallback((url: string) => {
    // Example: tanko://dashboard/conductor
    // data.url will be the full URL
    try {
      const slug = url.split('://').pop();
      if (slug) {
        // Ensure we handle potential leading slashes
        const path = slug.startsWith('/') ? slug : `/${slug}`;
        console.log('Navigating to deep link path:', path);
        router.push(path);
      }
    } catch (err) {
      console.error('Error handling deep link:', err);
    }
  }, [router]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener('appUrlOpen', (data) => {
      handleDeepLink(data.url);
    });

    // Handle the case where the app was opened via a deep link while it was closed
    const checkInitialUrl = async () => {
      const launchUrl = await App.getLaunchUrl();
      if (launchUrl?.url) {
        handleDeepLink(launchUrl.url);
      }
    };

    checkInitialUrl();

    return () => {
      listener.then(l => l.remove());
    };
  }, [handleDeepLink]);
}
