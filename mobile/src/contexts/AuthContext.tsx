import React, { createContext, useContext, useState, useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import CookieManager from '@react-native-cookies/cookies';
import axios from 'axios';
import { AuthContextType } from '../types';
import { navigationService } from '../services/NavigationService';
import { cookieService } from '../services/CookieService';

// Configure axios defaults to match web client
const API_BASE_URL = 'https://camux.aidandj.com:3001'; // Android emulator
// const API_BASE_URL = 'http://10.0.2.2:6001'; // Android emulator
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true; // Use cookies like web client

// Configure axios interceptors for cookie handling
axios.interceptors.request.use(async (config) => {
  try {
    // Get all cookies for the API domain
    const cookies = await CookieManager.get(API_BASE_URL);
    if (cookies && Object.keys(cookies).length > 0) {
      // Convert cookies to header format
      const cookieHeader = Object.entries(cookies)
        .map(([name, cookie]) => `${name}=${cookie.value}`)
        .join('; ');
      config.headers.Cookie = cookieHeader;
      console.log('Sending cookies with request:', Object.keys(cookies));
    } else {
      console.log('No cookies found for request to:', config.url);
    }
  } catch (error) {
    console.error('Error getting cookies for request:', error);
  }
  return config;
});

axios.interceptors.response.use(async (response) => {
  try {
    // Store any Set-Cookie headers
    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      for (const cookieString of setCookieHeader) {
        await CookieManager.setFromResponse(API_BASE_URL, cookieString);
      }
    }
  } catch (error) {
    console.error('Error setting cookies from response:', error);
  }
  return response;
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupDeepLinkListener = () => {
      // Listen for URL events
      const urlSubscription = Linking.addEventListener('url', (event) => {
        handleDeepLink(event.url);
      });

      // Check for initial URL when app starts
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      }).catch((error) => {
        console.error('Error getting initial URL:', error);
      });

      return () => {
        urlSubscription?.remove();
      };
    };

    initializeServices();
    checkAuthStatus();
    const cleanup = setupDeepLinkListener();
    
    return cleanup;
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize cookie persistence
      await cookieService.initializePersistence(API_BASE_URL);
      
      // Check if we have existing session cookies
      const cookies = await CookieManager.get(API_BASE_URL);
      if (cookies && Object.keys(cookies).length > 0) {
        console.log('Found existing session cookies, user may still be logged in');
      } else {
        console.log('No existing session cookies found');
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const handleDeepLink = (url: string) => {
    if (url.startsWith('camux://auth')) {
      try {
        const urlObj = new URL(url);
        const success = urlObj.searchParams.get('success');
        const error = urlObj.searchParams.get('error');

        if (success === 'true') {
          const token = urlObj.searchParams.get('token');

          if (token) {
            exchangeTokenForSession(token);
          } else {
            // Fallback: just check status after a delay
            setTimeout(() => {
              checkAuthStatus();
            }, 1000);
          }
        } else if (error) {
          Alert.alert('Authentication Error', `Login failed: ${error}`);
          setLoading(false);
        }
      } catch (urlError) {
        // Fallback to status check
        setTimeout(() => {
          checkAuthStatus();
        }, 1000);
      }
    }
  };

  const exchangeTokenForSession = async (token: string) => {
    try {
      const response = await axios.post('/api/auth/mobile/exchange', { token });

      if (response.data.success) {
        // Ensure cookies are persisted
        await cookieService.ensurePersistence(API_BASE_URL);
        
        // Verify cookies were stored
        const cookies = await CookieManager.get(API_BASE_URL);
        console.log('Session cookies after token exchange:', Object.keys(cookies));
        
        setIsAuthenticated(true);
        navigationService.replace('CameraList');
      } else {
        setIsAuthenticated(false);
        Alert.alert('Authentication Error', 'Server rejected the authentication token');
      }
    } catch (error: any) {
      if (error.response) {
        Alert.alert('Authentication Error', `Failed to exchange token: ${error.response.data?.error || 'Unknown error'}`);
      } else if (error.request) {
        Alert.alert('Network Error', 'Could not connect to server. Please check your internet connection.');
      } else {
        Alert.alert('Authentication Error', 'Failed to complete mobile authentication');
      }
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const response = await axios.get('/api/auth/status');
      console.log('Auth status response:', response.data);
      
      if (response.data.authenticated) {
        console.log('User is authenticated, userId:', response.data.userId);
        setIsAuthenticated(true);
        
        // Navigate to camera list if not already there
        console.log('Navigating to CameraList screen...');
        navigationService.replace('CameraList');
      } else {
        console.log('User is not authenticated');
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      console.error('Auth status check failed:', error.response?.status, error.response?.data || error.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      const authUrl = `${API_BASE_URL}/api/auth/google?mobile=true`;
      await Linking.openURL(authUrl);
    } catch (error) {
      Alert.alert('Login Error', 'Failed to start authentication');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      
      // Clear all cookies and backups
      await cookieService.clearAllCookies();
      
      setIsAuthenticated(false);
      
      // Navigate back to login screen
      navigationService.replace('Login');
    } catch (error) {
      // Still clear cookies and set as logged out locally
      try {
        await cookieService.clearAllCookies();
      } catch (cookieError) {
        // Ignore cookie clear errors
      }
      setIsAuthenticated(false);
      
      // Navigate back to login screen even if logout request failed
      navigationService.replace('Login');
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
