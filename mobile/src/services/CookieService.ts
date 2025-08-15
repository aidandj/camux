import CookieManager from '@react-native-cookies/cookies';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COOKIE_BACKUP_KEY = '@camux_session_backup';

class CookieService {
  async initializePersistence(apiBaseUrl: string): Promise<void> {
    try {
      // Flush any pending cookie operations
      await CookieManager.flush();
      
      // Try to restore cookies from backup if main storage is empty
      const cookies = await CookieManager.get(apiBaseUrl);
      if (!cookies || Object.keys(cookies).length === 0) {
        await this.restoreCookiesFromBackup(apiBaseUrl);
      } else {
        // Backup current cookies
        await this.backupCookies(apiBaseUrl);
      }
    } catch (error) {
      console.error('Failed to initialize cookie persistence:', error);
    }
  }

  async ensurePersistence(apiBaseUrl: string): Promise<void> {
    try {
      // Flush cookies to ensure they're written to disk
      await CookieManager.flush();
      
      // Create backup of current cookies
      await this.backupCookies(apiBaseUrl);
    } catch (error) {
      console.error('Failed to ensure cookie persistence:', error);
    }
  }

  private async backupCookies(apiBaseUrl: string): Promise<void> {
    try {
      const cookies = await CookieManager.get(apiBaseUrl);
      if (cookies && Object.keys(cookies).length > 0) {
        await AsyncStorage.setItem(COOKIE_BACKUP_KEY, JSON.stringify(cookies));
        console.log('Cookies backed up to AsyncStorage');
      }
    } catch (error) {
      console.error('Failed to backup cookies:', error);
    }
  }

  private async restoreCookiesFromBackup(apiBaseUrl: string): Promise<void> {
    try {
      const backupData = await AsyncStorage.getItem(COOKIE_BACKUP_KEY);
      if (backupData) {
        const cookies = JSON.parse(backupData);
        
        // Restore each cookie
        for (const [name, cookieData] of Object.entries(cookies)) {
          const cookie = cookieData as any;
          if (cookie.value) {
            await CookieManager.set(apiBaseUrl, {
              name: name,
              value: cookie.value,
              domain: cookie.domain || new URL(apiBaseUrl).hostname,
              path: cookie.path || '/',
              secure: cookie.secure || apiBaseUrl.startsWith('https'),
              httpOnly: cookie.httpOnly || false,
            });
          }
        }
        
        await CookieManager.flush();
        console.log('Cookies restored from backup');
      }
    } catch (error) {
      console.error('Failed to restore cookies from backup:', error);
    }
  }

  async clearAllCookies(): Promise<void> {
    try {
      await CookieManager.clearAll(true);
      await CookieManager.flush();
      await AsyncStorage.removeItem(COOKIE_BACKUP_KEY);
      console.log('All cookies and backups cleared');
    } catch (error) {
      console.error('Failed to clear cookies:', error);
    }
  }
}

export const cookieService = new CookieService();