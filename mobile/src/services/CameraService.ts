import axios from 'axios';
import axiosRetry from 'axios-retry';
import { Camera } from '../types';

export class CameraServiceError extends Error {
  constructor(message: string, public statusCode?: number, public isAuthError?: boolean) {
    super(message);
    this.name = 'CameraServiceError';
  }
}

class CameraService {
  constructor() {
    axiosRetry(axios, {
      retries: 5,
      retryDelay: axiosRetry.exponentialDelay,
    });
  }

  async getCameras(): Promise<Camera[]> {
    try {
      // Match web client - use relative path and withCredentials
      const response = await axios.get('/api/devices', { withCredentials: true });

      if (response.data.requiresPartnerConnection) {
        throw new CameraServiceError('Partner connection required. Please set up Google Device Access.', 400);
      }

      return response.data.cameras || [];
    } catch (error: any) {
      console.error('Error fetching cameras:', error);

      if (error instanceof CameraServiceError) {
        throw error;
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error || error.response.data?.message || 'Unknown error';

        if (status === 401) {
          throw new CameraServiceError('Your session has expired. Please log in again.', 401, true);
        } else if (status === 403) {
          throw new CameraServiceError('Access denied. Check your Google Device Access permissions.', 403);
        } else if (status === 404) {
          throw new CameraServiceError('Camera service not found. Please check your configuration.', 404);
        } else if (status === 500) {
          throw new CameraServiceError('Server error. Please try again later.', 500);
        } else {
          throw new CameraServiceError(`Failed to load cameras: ${message}`, status);
        }
      } else if (error.request) {
        throw new CameraServiceError('Unable to connect to server. Please check your internet connection.', 0);
      } else {
        throw new CameraServiceError('An unexpected error occurred while loading cameras.', 0);
      }
    }
  }
}

export const cameraService = new CameraService();
