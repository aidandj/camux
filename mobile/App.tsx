import React, { useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './src/screens/LoginScreen';
import CameraListScreen from './src/screens/CameraListScreen';
import { AuthProvider } from './src/contexts/AuthContext';
import { CameraControlProvider } from './src/contexts/CameraControlContext';
import { RootStackParamList } from './src/types';
import { navigationService } from './src/services/NavigationService';

const Stack = createStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  return (
    <AuthProvider>
      <CameraControlProvider>
        <NavigationContainer 
          ref={navigationRef}
          onReady={() => {
            if (navigationRef.current) {
              navigationService.setNavigationRef(navigationRef.current);
            }
          }}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <SafeAreaView style={styles.container}>
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#2563eb',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: 'Camux - Camera Viewer' }}
              />
              <Stack.Screen
                name="CameraList"
                component={CameraListScreen}
                options={{ title: 'Your Cameras' }}
              />
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </CameraControlProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
});

export default App;
