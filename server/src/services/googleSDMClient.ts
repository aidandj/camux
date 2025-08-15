import { google, smartdevicemanagement_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class GoogleSDMClient {
  private sdm: smartdevicemanagement_v1.Smartdevicemanagement;
  private auth: OAuth2Client;
  private projectId: string;

  constructor(accessToken: string) {
    this.projectId = process.env.GOOGLE_PROJECT_ID!;
    
    // Create OAuth2 client with the access token
    this.auth = new OAuth2Client();
    this.auth.setCredentials({
      access_token: accessToken
    });

    // Initialize the Smart Device Management API client
    this.sdm = google.smartdevicemanagement({
      version: 'v1',
      auth: this.auth
    });
  }

  async listDevices() {
    try {
      const response = await this.sdm.enterprises.devices.list({
        parent: `enterprises/${this.projectId}`
      });

      return response.data.devices || [];
    } catch (error) {
      console.error('Error listing devices:', error);
      throw error;
    }
  }

  async getDevice(deviceName: string) {
    try {
      const response = await this.sdm.enterprises.devices.get({
        name: deviceName
      });

      return response.data;
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  async executeCommand(deviceName: string, command: string, params?: any) {
    try {
      const response = await this.sdm.enterprises.devices.executeCommand({
        name: deviceName,
        requestBody: {
          command,
          params
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error executing command:', error);
      throw error;
    }
  }

  async generateWebRtcStream(deviceName: string, offerSdp: string) {
    return this.executeCommand(
      deviceName,
      'sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream',
      { offerSdp }
    );
  }

  async extendWebRtcStream(deviceName: string, streamExtensionToken: string) {
    return this.executeCommand(
      deviceName,
      'sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream',
      { streamExtensionToken }
    );
  }

  async stopWebRtcStream(deviceName: string, streamToken: string) {
    return this.executeCommand(
      deviceName,
      'sdm.devices.commands.CameraLiveStream.StopWebRtcStream',
      { streamToken }
    );
  }

  async listStructures() {
    try {
      const response = await this.sdm.enterprises.structures.list({
        parent: `enterprises/${this.projectId}`
      });

      return response.data.structures || [];
    } catch (error) {
      console.error('Error listing structures:', error);
      throw error;
    }
  }
}