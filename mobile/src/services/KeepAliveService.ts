import { AppState, Alert } from 'react-native';

class KeepAliveService {
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isActive = false;
  private appStateSubscription: any = null;

  async start() {
    if (this.isActive) return;

    this.isActive = true;
    console.log('KeepAlive service started');

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);

    // Start keep-alive ping every 30 seconds
    this.keepAliveInterval = setInterval(() => {
      this.keepAlive();
    }, 30000);

    // Request user to disable battery optimization
    this.requestBatteryOptimizationDisable();
  }

  async stop() {
    if (!this.isActive) return;

    this.isActive = false;
    console.log('KeepAlive service stopped');

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }

  private handleAppStateChange = (nextAppState: string) => {
    console.log('App state changed to:', nextAppState);
    
    if (nextAppState === 'background' && this.isActive) {
      console.log('App backgrounded - keeping connection alive');
      // Immediately ping to establish we're still alive
      this.keepAlive();
    }
  };

  private keepAlive() {
    if (!this.isActive) return;
    
    // Simple console log to keep JS bridge active
    console.log(`KeepAlive ping: ${new Date().toISOString()}`);
    
    // You could also make a lightweight API call here if needed
    // fetch('/api/keepalive', { method: 'HEAD' }).catch(() => {});
  }

  private requestBatteryOptimizationDisable() {
    // Show user instructions for battery optimization
    setTimeout(() => {
      Alert.alert(
        'Battery Optimization',
        'For best performance, please disable battery optimization for Camux in your device settings:\n\n' +
        '1. Go to Settings > Apps > Camux\n' +
        '2. Tap "Battery" or "Battery Usage"\n' +
        '3. Select "Don\'t optimize" or "No restrictions"\n\n' +
        'This keeps camera streams active in the background.',
        [
          { text: 'OK', style: 'default' },
          { text: 'Remind Later', style: 'cancel' }
        ]
      );
    }, 5000);
  }

  isRunning(): boolean {
    return this.isActive;
  }
}

export const keepAliveService = new KeepAliveService();