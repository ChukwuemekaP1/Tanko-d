import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tanko.driver',
  appName: 'Tanko-d',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    DeepLinks: {
      schemes: ['tanko']
    }
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
