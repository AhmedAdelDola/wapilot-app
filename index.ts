import { registerRootComponent } from 'expo';
import * as SplashScreen from 'expo-splash-screen';

import 'react-native-gesture-handler';

import App from './App';

// Keep the splash screen visible while assets/fonts are loading
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);