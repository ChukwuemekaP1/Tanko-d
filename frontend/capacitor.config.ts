import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tanko.driver',
  appName: 'Tanko-d',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    DeepLinks: {
      schemes: ['tanko']
    }
  }
};

export default config;
