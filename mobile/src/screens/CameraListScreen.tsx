import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useCameraControl } from '../contexts/CameraControlContext';
import CameraCard from '../components/CameraCard';
import { Camera } from '../types';
import { cameraService, CameraServiceError } from '../services/CameraService';

const CameraListScreen: React.FC = () => {
  const { logout } = useAuth();
  const { videoEnabled, audioEnabled, toggleVideo, toggleAudio } = useCameraControl();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const cameraList = await cameraService.getCameras();
      setCameras(cameraList);
    } catch (error) {
      if (error instanceof CameraServiceError) {
        if (error.isAuthError) {
          // Handle 401 - session expired, offer re-authentication
          Alert.alert(
            'Session Expired',
            error.message,
            [
              {
                text: 'Cancel',
                style: 'cancel',
              },
              {
                text: 'Log In Again',
                onPress: () => {
                  logout(); // This will clear the session and navigate to login
                },
              },
            ]
          );
        } else {
          // Handle other API errors with specific messages
          Alert.alert('Error', error.message);
        }
      } else {
        // Handle unexpected errors
        Alert.alert(
          'Unexpected Error',
          'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCameras();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const renderCamera = ({ item }: { item: Camera }) => (
    <CameraCard camera={item} />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading cameras...</Text>
      </View>
    );
  }

  if (cameras.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>No Cameras Found</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        {/* Global Controls */}
        <View style={styles.globalControls}>
          <Text style={styles.controlsTitle}>Global Media Controls</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[styles.controlButton, videoEnabled ? styles.enabledButton : styles.disabledButton]}
              onPress={toggleVideo}>
              <Text style={[styles.controlButtonText, videoEnabled ? styles.enabledText : styles.disabledText]}>
                Video {videoEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, audioEnabled ? styles.enabledButton : styles.disabledButton]}
              onPress={toggleAudio}>
              <Text style={[styles.controlButtonText, audioEnabled ? styles.enabledText : styles.disabledText]}>
                Audio {audioEnabled ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.emptyCenterContainer}>
          <Text style={styles.emptyTitle}>No Cameras Found</Text>
          <Text style={styles.emptySubtitle}>
            Make sure your cameras are linked to your Google account
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {cameras.length} Camera{cameras.length !== 1 ? 's' : ''} Found
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Global Controls */}
      <View style={styles.globalControls}>
        <Text style={styles.controlsTitle}>Global Media Controls</Text>
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, videoEnabled ? styles.enabledButton : styles.disabledButton]}
            onPress={toggleVideo}>
            <Text style={[styles.controlButtonText, videoEnabled ? styles.enabledText : styles.disabledText]}>
              Video {videoEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, audioEnabled ? styles.enabledButton : styles.disabledButton]}
            onPress={toggleAudio}>
            <Text style={[styles.controlButtonText, audioEnabled ? styles.enabledText : styles.disabledText]}>
              Audio {audioEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={cameras}
        renderItem={renderCamera}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: -60, // Account for header height
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#6b7280',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 280,
  },
  globalControls: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  enabledButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  enabledText: {
    color: '#ffffff',
  },
  disabledText: {
    color: '#ffffff',
  },
});

export default CameraListScreen;