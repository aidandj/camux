import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

class NavigationService {
  private navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

  setNavigationRef(ref: NavigationContainerRef<RootStackParamList>) {
    this.navigationRef = ref;
  }

  navigate(name: keyof RootStackParamList, params?: any) {
    if (this.navigationRef && this.navigationRef.isReady()) {
      this.navigationRef.navigate(name, params);
    } else {
      console.warn('Navigation ref not ready or not set');
    }
  }

  replace(name: keyof RootStackParamList, params?: any) {
    if (this.navigationRef && this.navigationRef.isReady()) {
      this.navigationRef.reset({
        index: 0,
        routes: [{ name, params }],
      });
    } else {
      console.warn('Navigation ref not ready or not set');
    }
  }
}

export const navigationService = new NavigationService();