import { NativeModules, Platform } from 'react-native';

interface BackgroundAudioModule {
  startBackgroundAudio(): Promise<string>;
  stopBackgroundAudio(): Promise<string>;
}

const { BackgroundAudioModule } = NativeModules as {
  BackgroundAudioModule: BackgroundAudioModule;
};

class BackgroundAudioServiceClass {
  private isServiceRunning = false;

  async startBackgroundAudio(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('Background audio service only available on Android');
      return;
    }

    if (this.isServiceRunning) {
      console.log('Background audio service already running');
      return;
    }

    try {
      await BackgroundAudioModule.startBackgroundAudio();
      this.isServiceRunning = true;
      console.log('Background audio service started successfully');
    } catch (error) {
      console.error('Failed to start background audio service:', error);
      throw error;
    }
  }

  async stopBackgroundAudio(): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('Background audio service only available on Android');
      return;
    }

    if (!this.isServiceRunning) {
      console.log('Background audio service not running');
      return;
    }

    try {
      await BackgroundAudioModule.stopBackgroundAudio();
      this.isServiceRunning = false;
      console.log('Background audio service stopped successfully');
    } catch (error) {
      console.error('Failed to stop background audio service:', error);
      throw error;
    }
  }

  isRunning(): boolean {
    return this.isServiceRunning;
  }
}

export const backgroundAudioService = new BackgroundAudioServiceClass();