import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.schedulr.app',
  appName: 'Schedulr',
  webDir: 'dist',
  server: {
    url: 'https://73802743-4fa3-4844-b555-b1ddf35e4baf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
