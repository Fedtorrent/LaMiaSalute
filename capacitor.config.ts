import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lamiasalute.app',
  appName: 'La Mia Salute',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  },
  plugins: {
    CapacitorSQLite: {
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: "Autenticazione biometrica",
        biometricSubTitle: "Sblocca il database"
      }
    }
  }
};

export default config;
