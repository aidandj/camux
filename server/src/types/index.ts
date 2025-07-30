import { Session } from 'express-session';

export interface UserSession extends Session {
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface GoogleDevice {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

export interface CameraStreamResponse {
  streamUrls: {
    rtspUrl?: string;
    webRtcUrl?: string;
  };
  streamExtensionToken: string;
  streamToken: string;
  expiresAt: string;
}