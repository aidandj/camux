export interface Camera {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

export interface StreamData {
  answerSdp?: string;
  streamToken?: string;
  streamExtensionToken?: string;
  results?: {
    answerSdp?: string;
    streamToken?: string;
    streamExtensionToken?: string;
  };
}

export type RootStackParamList = {
  Login: undefined;
  CameraList: undefined;
};