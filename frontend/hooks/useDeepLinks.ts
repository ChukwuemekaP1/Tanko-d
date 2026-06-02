'use client'

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

export function useDeepLinks() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleDeepLink = (data: any) => {
      // Example: tanko://dashboard/conductor
      // data.url will be the full URL
      const slug = data.url.split('://').pop();
      if (slug) {
        router.push(`/${slug}`);
      }
    };

    App.addListener('appUrlOpen', handleDeepLink);

    // Handle the case where the app was opened via a deep link while it was closed
    const checkInitialUrl = async () => {
      const { url } = await App.getLaunchUrl() || { url: null };
      if (url) {
        handleDeepLink({ url });
      }
    };

    checkInitialUrl();

    return () => {
      App.removeAllListeners();
    };
  }, [router]);
}
