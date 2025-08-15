import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { Camera, StreamData } from '../types';
import { webRTCService } from '../services/WebRTCService';
import { useCameraControl } from '../contexts/CameraControlContext';

interface CameraCardProps {
  camera: Camera;
}

const CameraCard: React.FC<CameraCardProps> = ({ camera }) => {
  const { videoEnabled: globalVideoEnabled, audioEnabled: globalAudioEnabled } = useCameraControl();
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const peerConnectionRef = useRef<any>(null);
  const streamDataRef = useRef<StreamData | null>(null);

  const deviceId = camera.name.split('/').pop();
  const displayName = camera.parentRelations[0]?.displayName || deviceId;

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  // Sync with global video/audio state
  useEffect(() => {
    if (remoteStream && streaming) {
      const videoTracks = remoteStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = globalVideoEnabled;
      });
      setVideoEnabled(globalVideoEnabled);
    }
  }, [globalVideoEnabled, remoteStream, streaming]);

  useEffect(() => {
    if (remoteStream && streaming) {
      const audioTracks = remoteStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = globalAudioEnabled;
      });
      setAudioEnabled(globalAudioEnabled);
    }
  }, [globalAudioEnabled, remoteStream, streaming]);

  const startStream = async () => {
    setLoading(true);
    try {
      const { peerConnection, stream, streamData } = await webRTCService.startStream(deviceId!);
      
      peerConnectionRef.current = peerConnection;
      streamDataRef.current = streamData;
      setRemoteStream(stream);
      setStreaming(true);

    } catch (error) {
      console.error('Failed to start stream:', error);
      Alert.alert('Stream Error', 'Failed to start camera stream');
    } finally {
      setLoading(false);
    }
  };

  const stopStream = async () => {
    try {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (streamDataRef.current) {
        await webRTCService.stopStream(deviceId!, streamDataRef.current);
        streamDataRef.current = null;
      }

      setRemoteStream(null);
      setStreaming(false);
    } catch (error) {
      console.error('Failed to stop stream:', error);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.cameraName}>{displayName}</Text>
        <Text style={styles.cameraType}>{camera.type.split('.').pop()}</Text>
      </View>

      <View style={styles.videoContainer}>
        {streaming && remoteStream ? (
          <>
            {videoEnabled ? (
              <RTCView
                streamURL={remoteStream.id}
                style={styles.video}
                objectFit="contain"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderText}>📹</Text>
                <Text style={styles.disabledText}>Video Disabled</Text>
                <Text style={styles.audioStatusText}>
                  Audio {audioEnabled ? 'Streaming' : 'Disabled'}
                </Text>
              </View>
            )}
          </>
        ) : streaming ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>📹</Text>
            <Text style={styles.streamingText}>Camera Streaming</Text>
            <Text style={styles.demoText}>(Demo Mode - No Video Feed)</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>📷</Text>
            <Text style={styles.offlineText}>Camera Offline</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {!streaming ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={startStream}
            disabled={loading}>
            <Text style={styles.startButtonText}>
              {loading ? 'Starting...' : 'Start Stream'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.controlRow}>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopStream}>
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
            <View style={styles.mediaControls}>
              <Text style={styles.statusText}>
                V: {videoEnabled ? 'On' : 'Off'} | A: {audioEnabled ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cameraName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cameraType: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  videoContainer: {
    height: 200,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  streamingText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineText: {
    color: '#6b7280',
    fontSize: 16,
  },
  demoText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  disabledText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  audioStatusText: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  mediaControls: {
    marginLeft: 16,
  },
  statusText: {
    color: '#6b7280',
    fontSize: 12,
  },
  controls: {
    padding: 16,
  },
  startButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraCard;