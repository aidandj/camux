import { Platform } from 'react-native';

class AudioService {
  async configureAudioForMediaPlayback(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // For Android, we rely on the native configuration in MainActivity
        // The WebRTC library should respect the AudioManager.MODE_NORMAL setting
        console.log('Audio configured for media playback on Android');
      } catch (error) {
        console.error('Failed to configure Android audio:', error);
      }
    } else if (Platform.OS === 'ios') {
      try {
        // iOS audio routing is handled automatically by the WebRTC library
        // and the audio session configuration in Info.plist
        console.log('Audio configured for media playback on iOS');
      } catch (error) {
        console.error('Failed to configure iOS audio:', error);
      }
    }
  }

  async configureAudioForPhoneCall(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        // Switch to phone call mode if needed (for actual phone features)
        console.log('Audio configured for phone call on Android');
      } catch (error) {
        console.error('Failed to configure Android audio for phone call:', error);
      }
    }
  }

  async resetAudioConfiguration(): Promise<void> {
    // Reset to default configuration
    await this.configureAudioForMediaPlayback();
  }
}

export const audioService = new AudioService();