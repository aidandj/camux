import React, { createContext, useContext, useState, useCallback } from 'react';

interface CameraControlContextType {
  videoEnabled: boolean;
  audioEnabled: boolean;
  toggleVideo: () => void;
  toggleAudio: () => void;
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
}

export const CameraControlProvider: React.FC<CameraControlProviderProps> = ({ children }) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const toggleVideo = useCallback(() => {
    setVideoEnabled(prev => !prev);
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

  const value: CameraControlContextType = {
    videoEnabled,
    audioEnabled,
    toggleVideo,
    toggleAudio,
  };

  return (
    <CameraControlContext.Provider value={value}>
      {children}
    </CameraControlContext.Provider>
  );
};