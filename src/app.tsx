import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Alert, BackHandler, Platform } from 'react-native';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/viewmodels/store';
import { AppNavigator } from '@/views/navigation';
import { AppErrorBoundary } from '@/views/components/error-boundary';
import { AnimatedSplash } from '@/views/screens/splash/AnimatedSplash';

import i18n from '@/i18n';

let NavigationBar: typeof import('expo-navigation-bar') | null = null;
try {
  NavigationBar = require('expo-navigation-bar');
} catch {}

const Chatwoot = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android' && NavigationBar) {
      try {
        NavigationBar.setVisibilityAsync('hidden');

        const navSubscription = NavigationBar.addVisibilityListener(({ visibility }: { visibility: string }) => {
          if (visibility === 'visible') {
            setTimeout(() => {
              NavigationBar?.setVisibilityAsync('hidden');
            }, 1500);
          }
        });

        const backSubscription = BackHandler.addEventListener(
          'hardwareBackPress',
          handleBackButtonClick,
        );

        return () => {
          navSubscription.remove();
          backSubscription.remove();
        };
      } catch {}
    }

    const backSubscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButtonClick,
    );
    return () => backSubscription.remove();
  }, []);
  const handleBackButtonClick = () => {
    Alert.alert(
      i18n.t('EXIT.TITLE'),
      i18n.t('EXIT.SUBTITLE'),
      [
        {
          text: i18n.t('EXIT.CANCEL'),
          onPress: () => {},
          style: 'cancel',
        },
        { text: i18n.t('EXIT.OK'), onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: false },
    );
    return true;
  };

  const handleBeforeLift = () => {
    const state = store.getState();
    const { settings } = state;
    if (settings?.localeValue) {
      i18n.locale = settings.localeValue;
    }
  };

  return (
    <Provider store={store}>
      {showSplash ? (
        <AnimatedSplash onFinish={() => setShowSplash(false)} />
      ) : (
        <PersistGate loading={null} persistor={persistor} onBeforeLift={handleBeforeLift}>
          <AppErrorBoundary>
            <AppNavigator />
          </AppErrorBoundary>
        </PersistGate>
      )}
    </Provider>
  );
};

export default Chatwoot;
