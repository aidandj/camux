import axios from 'axios';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';
import { StreamData } from '../types';
import { keepAliveService } from './KeepAliveService';
import { audioService } from './AudioService';
import { backgroundAudioService } from './BackgroundAudioService';

class WebRTCService {
  private streamExtensionIntervals: Map<string, NodeJS.Timeout> = new Map();

  async startStream(deviceId: string) {
    try {
      // Configure audio for media playback
      await audioService.configureAudioForMediaPlayback();
      
      // Create peer connection with Google's configuration (no ICE servers)
      const peerConnection = new RTCPeerConnection({
        iceServers: []
      });

      // Add transceivers in required order: audio, video, application
      peerConnection.addTransceiver('audio', { direction: 'recvonly' });
      peerConnection.addTransceiver('video', { direction: 'recvonly' });
      
      // Add data channel for required "application" m-line
      peerConnection.createDataChannel('dataSendChannel', { ordered: true });

      let collectedStream: MediaStream | null = null;

      // Set up track handling - matches web client
      peerConnection.addEventListener('track', (event) => {
        console.log('Track received:', event.track.kind);
        
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
        
        // If we have both audio and video, we're ready
        if (collectedStream.getAudioTracks().length > 0 && 
            collectedStream.getVideoTracks().length > 0) {
          console.log('Both tracks collected, stream ready');
        }
      });

      peerConnection.addEventListener('icecandidate', () => {
        // Handle ICE candidates - Google Nest doesn't use them
      });

      peerConnection.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', peerConnection.connectionState);
      });

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to server - match web client API
      const response = await axios.post(
        `/api/stream/${deviceId}/generate`,
        { offerSdp: offer.sdp }
      );

      console.log('Stream response received');

      // Start keep-alive service to maintain connection
      await keepAliveService.start();

      // Get answer SDP - check both possible locations
      let answerSdp = response.data.results?.answerSdp || response.data.answerSdp;
      if (!answerSdp) {
        throw new Error('No answer SDP received from server');
      }

      // Ensure SDP ends with newline (as per Google's sample)
      if (answerSdp[answerSdp.length - 1] !== '\n') {
        answerSdp += '\n';
      }

      // Set remote description
      await peerConnection.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      // Set up stream extension every 4 minutes (stream expires in 5)
      const extensionToken = response.data.results?.streamExtensionToken || 
                           response.data.streamExtensionToken;
      if (extensionToken) {
        const intervalId = setInterval(() => {
          this.extendStream(deviceId, extensionToken);
        }, 4 * 60 * 1000);
        this.streamExtensionIntervals.set(deviceId, intervalId);
      }

      // Start background audio service when first stream starts
      if (this.streamExtensionIntervals.size === 1) {
        try {
          await backgroundAudioService.startBackgroundAudio();
        } catch (error) {
          console.warn('Failed to start background audio service:', error);
        }
      }

      return {
        peerConnection,
        stream: collectedStream,
        streamData: response.data,
      };
    } catch (error) {
      console.error('Failed to start stream:', error);
      throw error;
    }
  }

  private async extendStream(deviceId: string, token: string) {
    try {
      const response = await axios.post(
        `/api/stream/${deviceId}/extend`,
        { streamExtensionToken: token }
      );
      console.log('Stream extended for device:', deviceId);
      return response.data;
    } catch (error) {
      console.error('Failed to extend stream:', error);
      // Stop the stream if extension fails
      this.stopStream(deviceId, { streamExtensionToken: token });
    }
  }

  async stopStream(deviceId: string, streamData: StreamData): Promise<void> {
    try {
      // Clear extension interval
      const intervalId = this.streamExtensionIntervals.get(deviceId);
      if (intervalId) {
        clearInterval(intervalId);
        this.streamExtensionIntervals.delete(deviceId);
      }

      // Stop stream on server
      const streamToken = streamData.results?.streamToken || streamData.streamToken;
      if (streamToken) {
        await axios.post(
          `/api/stream/${deviceId}/stop`,
          { streamToken }
        );
      }

      // Stop keep-alive service when no more streams
      if (this.streamExtensionIntervals.size === 0) {
        await keepAliveService.stop();
        
        // Stop background audio service when all streams are stopped
        try {
          await backgroundAudioService.stopBackgroundAudio();
        } catch (error) {
          console.warn('Failed to stop background audio service:', error);
        }
      }

      console.log('Stream stopped for device:', deviceId);
    } catch (error) {
      console.error('Error stopping stream:', error);
      // Don't throw - stopping should always succeed locally
    }
  }
}

export const webRTCService = new WebRTCService();