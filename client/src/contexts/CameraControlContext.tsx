import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

interface Camera {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

interface CameraControlState {
  peerConnection: RTCPeerConnection | null;
  stream: MediaStream | null;
  streaming: boolean;
  loading: boolean;
  error: string | null;
  streamData: any;
  streamExtensionInterval: NodeJS.Timeout | null;
}

interface CameraControlContextType {
  selectedCameras: Set<string>;
  cameraStates: Map<string, CameraControlState>;
  videoEnabled: boolean;
  audioEnabled: boolean;
  toggleCameraSelection: (cameraId: string) => void;
  selectAllCameras: () => void;
  deselectAllCameras: () => void;
  startSelectedStreams: () => Promise<void>;
  stopSelectedStreams: () => Promise<void>;
  toggleVideo: () => void;
  toggleAudio: () => void;
  registerCameraCallbacks: (cameraId: string, callbacks: CameraCallbacks) => void;
  unregisterCameraCallbacks: (cameraId: string) => void;
}

interface CameraCallbacks {
  onStreamStart?: (stream: MediaStream) => void;
  onStreamStop?: () => void;
  onError?: (error: string) => void;
}

const CameraControlContext = createContext<CameraControlContextType | undefined>(undefined);

export const useCameraControl = () => {
  const context = useContext(CameraControlContext);
  if (!context) {
    throw new Error('useCameraControl must be used within a CameraControlProvider');
  }
  return context;
};

interface CameraControlProviderProps {
  children: React.ReactNode;
  cameras: Camera[];
}

export const CameraControlProvider: React.FC<CameraControlProviderProps> = ({ children, cameras }) => {
  const [selectedCameras, setSelectedCameras] = useState<Set<string>>(new Set());
  const [cameraStates] = useState<Map<string, CameraControlState>>(new Map());
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const cameraCallbacks = useRef<Map<string, CameraCallbacks>>(new Map());

  const toggleCameraSelection = useCallback((cameraId: string) => {
    setSelectedCameras(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cameraId)) {
        newSet.delete(cameraId);
      } else {
        newSet.add(cameraId);
      }
      return newSet;
    });
  }, []);

  const selectAllCameras = useCallback(() => {
    setSelectedCameras(new Set(cameras.map(cam => cam.name)));
  }, [cameras]);

  const deselectAllCameras = useCallback(() => {
    setSelectedCameras(new Set());
  }, []);

  const registerCameraCallbacks = useCallback((cameraId: string, callbacks: CameraCallbacks) => {
    cameraCallbacks.current.set(cameraId, callbacks);
  }, []);

  const unregisterCameraCallbacks = useCallback((cameraId: string) => {
    cameraCallbacks.current.delete(cameraId);
  }, []);

  const startSelectedStreams = useCallback(async () => {
    // This will be called by individual CameraView components
    // Each selected camera will start its own stream
    selectedCameras.forEach(cameraId => {
      const callbacks = cameraCallbacks.current.get(cameraId);
      if (callbacks?.onStreamStart) {
        // Trigger the camera to start streaming
        // The actual implementation will be in the CameraView component
      }
    });
  }, [selectedCameras]);

  const stopSelectedStreams = useCallback(async () => {
    selectedCameras.forEach(cameraId => {
      const callbacks = cameraCallbacks.current.get(cameraId);
      if (callbacks?.onStreamStop) {
        callbacks.onStreamStop();
      }
    });
  }, [selectedCameras]);

  const toggleVideo = useCallback(() => {
    setVideoEnabled(prev => !prev);
    // Each camera will handle this through its own state
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
    // Each camera will handle this through its own state
  }, []);

  const value: CameraControlContextType = {
    selectedCameras,
    cameraStates,
    videoEnabled,
    audioEnabled,
    toggleCameraSelection,
    selectAllCameras,
    deselectAllCameras,
    startSelectedStreams,
    stopSelectedStreams,
    toggleVideo,
    toggleAudio,
    registerCameraCallbacks,
    unregisterCameraCallbacks,
  };

  return (
    <CameraControlContext.Provider value={value}>
      {children}
    </CameraControlContext.Provider>
  );
};