import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, loading } = useAuth();

  const handleLogin = async () => {
    try {
      await login();
      // Navigation will happen automatically after token exchange
    } catch (error) {
      Alert.alert('Login Failed', 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🎥 Camux</Text>
        <Text style={styles.subtitle}>Google Home Camera Viewer</Text>
        
        <View style={styles.features}>
          <Text style={styles.feature}>• View multiple cameras simultaneously</Text>
          <Text style={styles.feature}>• Real-time WebRTC streaming</Text>
          <Text style={styles.feature}>• Mobile optimized interface</Text>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}>
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Requires Google Home cameras linked to your account
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 48,
    textAlign: 'center',
  },
  features: {
    marginBottom: 48,
    alignItems: 'flex-start',
  },
  feature: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  loginButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 24,
    minWidth: 200,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default LoginScreen;