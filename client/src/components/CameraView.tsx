import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import axios from 'axios';
import { useCameraControl } from '../contexts/CameraControlContext';

interface Camera {
  name: string;
  type: string;
  traits: Record<string, any>;
  parentRelations: Array<{
    parent: string;
    displayName: string;
  }>;
}

interface CameraViewProps {
  camera: Camera;
  onStreamingChange?: (streaming: boolean) => void;
}

export interface CameraViewHandle {
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
}

const CameraView = forwardRef<CameraViewHandle, CameraViewProps>(({ camera, onStreamingChange }, ref) => {
  const { 
    selectedCameras, 
    videoEnabled: globalVideoEnabled, 
    audioEnabled: globalAudioEnabled,
    toggleCameraSelection,
    registerCameraCallbacks,
    unregisterCameraCallbacks 
  } = useCameraControl();
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioMuted, setAudioMuted] = useState(false); // Start unmuted
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const streamExtensionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const deviceId = camera.name.split('/').pop();
  const displayName = camera.parentRelations[0]?.displayName || deviceId;
  const isSelected = selectedCameras.has(camera.name);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    startStream,
    stopStream
  }), []);

  // Register callbacks
  useEffect(() => {
    registerCameraCallbacks(camera.name, {
      onStreamStart: (stream) => setRemoteStream(stream),
      onStreamStop: () => stopStream(),
      onError: (error) => setError(error)
    });

    return () => {
      unregisterCameraCallbacks(camera.name);
      stopStream();
    };
  }, [camera.name]);

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

  // Set stream when video element is ready
  useEffect(() => {
    if (videoRef.current && remoteStream && streaming) {
      videoRef.current.srcObject = remoteStream;
      videoRef.current.muted = audioMuted;
      videoRef.current.volume = 1.0; // Ensure volume is at max
      videoRef.current.play()
        .then(() => {})
        .catch(() => {});
    }
  }, [remoteStream, streaming, audioMuted]);

  const startStream = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create peer connection with Google's configuration
      const servers: RTCConfiguration = {
        iceServers: []  // Google sample uses no ICE servers
      };
      const pc = new RTCPeerConnection(servers);

      // Add transceivers in the required order: audio, video, application
      pc.addTransceiver('audio', { direction: 'recvonly' });
      pc.addTransceiver('video', { direction: 'recvonly' });
      
      
      // Add data channel for the required "application" m-line
      pc.createDataChannel('dataSendChannel', {
        ordered: true
      });

      // Set up WebRTC event handlers
      let collectedStream: MediaStream | null = null;
      
      pc.ontrack = (event) => {
        
        // Create or get the collected stream
        if (!collectedStream) {
          collectedStream = new MediaStream();
        }
        
        // Add the track to our collected stream
        if (event.track.kind === 'audio') {
          collectedStream.addTrack(event.track);
        } else if (event.track.kind === 'video') {
          collectedStream.addTrack(event.track);
        }
        
        
        // If we have both audio and video, or after a short delay, set the stream
        if (collectedStream.getAudioTracks().length > 0 && collectedStream.getVideoTracks().length > 0) {
          const stream = collectedStream;
          
          
          // Store the stream - this should contain both audio and video
          setRemoteStream(stream);
          
          // Try to set it on video element if available
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.volume = 1.0;
            videoRef.current.muted = false;
            
            videoRef.current.play()
              .then(() => {})
              .catch(() => {});
          }
        }
      };

      pc.onicecandidate = () => {};

      pc.onnegotiationneeded = () => {};

      pc.onsignalingstatechange = () => {};

      // Create offer
      const offer = await pc.createOffer();
      
      await pc.setLocalDescription(offer);

      // Send offer to server
      const response = await axios.post(
        `/api/stream/${deviceId}/generate`,
        { offerSdp: offer.sdp },
        { withCredentials: true }
      );


      // Set remote description with the answer SDP
      // Check both possible locations for answerSdp
      let answerSdp = response.data.results?.answerSdp || response.data.answerSdp;
      if (!answerSdp) {
        throw new Error('No answer SDP received from server');
      }
      
      // Ensure SDP ends with newline (as per Google's sample)
      if (answerSdp[answerSdp.length - 1] !== '\n') {
        answerSdp += '\n';
      }
      
      
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

      pc.oniceconnectionstatechange = () => {};

      pc.onconnectionstatechange = () => {};

      setStreamData(response.data);
      peerConnectionRef.current = pc;
      setStreaming(true);
      onStreamingChange?.(true);

      // Set up stream extension every 4 minutes (stream expires in 5)
      const extensionToken = response.data.results?.streamExtensionToken || response.data.streamExtensionToken;
      if (extensionToken) {
        streamExtensionIntervalRef.current = setInterval(() => {
          extendStream(extensionToken);
        }, 4 * 60 * 1000);
      }
    } catch (error) {
      setError('Failed to start camera stream');
    } finally {
      setLoading(false);
    }
  };

  // Remove setupWebRTC as it's now integrated into startStream

  const extendStream = async (token: string) => {
    try {
      const response = await axios.post(
        `/api/stream/${deviceId}/extend`,
        { streamExtensionToken: token },
        { withCredentials: true }
      );
      setStreamData(response.data);
    } catch (error) {
      stopStream();
    }
  };



  const stopStream = async () => {
    if (streamExtensionIntervalRef.current) {
      clearInterval(streamExtensionIntervalRef.current);
      streamExtensionIntervalRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (streaming && streamData) {
      const streamToken = streamData.results?.streamToken || streamData.streamToken;
      if (streamToken) {
        try {
          await axios.post(
            `/api/stream/${deviceId}/stop`,
            { streamToken },
            { withCredentials: true }
          );
        } catch (error) {
          // Ignore stop errors
        }
      }
    }

    setStreaming(false);
    setStreamData(null);
    onStreamingChange?.(false);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">{displayName}</h3>
        <p className="text-sm text-gray-600">{camera.type.split('.').pop()}</p>
      </div>

      <div className="relative aspect-video bg-gray-900">
        {streaming ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className={`w-full h-full object-contain ${!videoEnabled ? 'hidden' : ''}`}
              onLoadedMetadata={() => {}}
            />
            {!videoEnabled && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">Video disabled</div>
                  <div className="text-gray-500 text-sm">Audio {audioEnabled ? 'streaming' : 'disabled'}</div>
                  {audioEnabled && (
                    <div className="mt-4">
                      <svg className="w-16 h-16 mx-auto text-gray-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">Camera not streaming</div>
              {error && (
                <p className="text-red-400 text-sm mb-4">{error}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          {/* Selection checkbox */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleCameraSelection(camera.name)}
              className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Select</span>
          </label>

          {/* Individual controls (only when not selected for group control) */}
          {!isSelected && (
            <div className="flex space-x-2">
              {!streaming ? (
                <button
                  onClick={startStream}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting...' : 'Start'}
                </button>
              ) : (
                <>
                  <button
                    onClick={stopStream}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                  >
                    Stop
                  </button>
                  <button
                    onClick={() => {
                      const newMutedState = !audioMuted;
                      setAudioMuted(newMutedState);
                      if (videoRef.current) {
                        videoRef.current.muted = newMutedState;
                      }
                    }}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
                    disabled={!audioEnabled}
                  >
                    {audioMuted ? 'Unmute' : 'Mute'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Status indicator for selected cameras */}
          {isSelected && streaming && (
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm text-gray-600">Streaming</span>
              </div>
              <div className="text-xs text-gray-500">
                V: {videoEnabled ? 'On' : 'Off'} | A: {audioEnabled ? 'On' : 'Off'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

CameraView.displayName = 'CameraView';

export default CameraView;