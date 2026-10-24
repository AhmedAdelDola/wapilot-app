import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';

export interface WebViewNavigationState {
  url: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  title: string;
}

import { useTheme } from '@/theme';
import { useAppSelector } from '@/hooks';
import { selectInstallationUrl } from '@/viewmodels/store/settings/settingsSelectors';
import { API_CONFIG } from '@/config/apiConfig';
import { MobileV2ScreenType, WebViewV2Descriptor } from '@/models/types/mobileV2';
import { mobileV2Service, extractUrlFromDescriptor } from '@/models/services/mobileV2Service';

const ArrowLeftIcon = ({ color = '#282E34' }: { color?: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export interface V2DashboardWebViewProps {
  /**
   * Async function to fetch the one-use descriptor from API v2
   */
  fetchDescriptor: () => Promise<WebViewV2Descriptor>;
  /**
   * Existing native v1 component to fall back to if v2 is not deployed or fails
   */
  fallbackComponent?: React.ReactNode;
  /**
   * Optional title for native header (e.g. in chat screen)
   */
  title?: string;
  /**
   * Show a back button in header (typically true for ChatScreen)
   */
  showBack?: boolean;
  /**
   * Callback when the user taps back (or when WebView cannot go back further)
   */
  onBack?: () => void;
  /**
   * The type of screen being rendered
   */
  screenType?: MobileV2ScreenType;
}

export const V2DashboardWebView: React.FC<V2DashboardWebViewProps> = ({
  fetchDescriptor,
  fallbackComponent,
  title,
  showBack,
  onBack,
  screenType = 'conversations',
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);

  const installationUrl = useAppSelector(selectInstallationUrl);
  const baseUrl = (API_CONFIG.baseUrl || installationUrl || '').trim().replace(/\/+$/, '');

  const [descriptor, setDescriptor] = useState<WebViewV2Descriptor | null>(null);
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasBootstrapLoaded, setHasBootstrapLoaded] = useState(false);

  const bgColor = isDark ? '#0D0D0D' : '#FAFAFA';
  const textPrimary = isDark ? '#FAFAFA' : '#0D0D0D';
  const textSecondary = isDark ? '#94a3b8' : '#626F7F';
  const borderColor = isDark ? '#212121' : '#EAEAEA';

  // Load a brand new descriptor (never retry the consumed one)
  const loadNewDescriptor = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    setHasBootstrapLoaded(false);

    try {
      const result = await fetchDescriptor();
      const extractedUrl = extractUrlFromDescriptor(result);

      if (extractedUrl) {
        let fullUrl = extractedUrl;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
          const cleanBase = baseUrl.replace(/\/+$/, '');
          fullUrl = cleanBase ? `${cleanBase}/${fullUrl.replace(/^\/+/, '')}` : fullUrl;
        }

        setDescriptor(
          typeof result === 'object' && result !== null
            ? (result as WebViewV2Descriptor)
            : ({ url: fullUrl, view_type: 'webview' } as any),
        );
        setCurrentUri(fullUrl);
        setUseFallback(false);
      } else {
        if (fallbackComponent) {
          setUseFallback(true);
        } else {
          setFetchError('No valid link received from server.');
        }
      }
    } catch (err: any) {
      if (fallbackComponent) {
        setUseFallback(true);
      } else {
        setFetchError(err?.response?.data?.message || err?.message || 'Failed to load view');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchDescriptor, fallbackComponent, baseUrl]);

  useEffect(() => {
    void loadNewDescriptor();
  }, [loadNewDescriptor]);

  // Handle hardware back on Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onHardwareBack = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [canGoBack, onBack]);

  // Handle navigation state changes inside WebView
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigationState) => {
      setCanGoBack(navState.canGoBack);

      if (navState.loading === false && !hasBootstrapLoaded) {
        setHasBootstrapLoaded(true);
        mobileV2Service.setHasActiveWebViewSession(true);
      }
    },
    [hasBootstrapLoaded],
  );

  // Allow all web URLs (http / https) to navigate inside WebView
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      const reqUrl = request.url;

      if (!reqUrl || reqUrl.startsWith('about:blank') || reqUrl.startsWith('data:')) {
        return true;
      }

      // Handle custom non-web URI schemes (tel, mailto, sms, whatsapp)
      if (
        reqUrl.startsWith('tel:') ||
        reqUrl.startsWith('mailto:') ||
        reqUrl.startsWith('sms:') ||
        reqUrl.startsWith('whatsapp:')
      ) {
        void Linking.openURL(reqUrl);
        return false;
      }

      // Keep ALL http / https URLs inside the WebView regardless of origin
      if (reqUrl.startsWith('http://') || reqUrl.startsWith('https://')) {
        return true;
      }

      // For any other scheme (intent:// etc), try opening in system
      try {
        void Linking.openURL(reqUrl);
      } catch {
        // ignore
      }
      return false;
    },
    [],
  );

  // If v2 is unavailable (e.g. server not deployed yet), render existing v1 native UI
  if (useFallback && fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // Loading state while requesting descriptor
  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar
          translucent
          backgroundColor={bgColor}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
        {showBack && (
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <ArrowLeftIcon color={textPrimary} />
            </Pressable>
            {title ? <Text style={[styles.headerTitle, { color: textPrimary }]}>{title}</Text> : null}
          </View>
        )}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4162E3" />
          <Text style={[styles.loadingText, { color: textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state when descriptor request fails and no fallback
  if (fetchError || !currentUri) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: bgColor }]}>
        <StatusBar
          translucent
          backgroundColor={bgColor}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
        {showBack && (
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <ArrowLeftIcon color={textPrimary} />
            </Pressable>
            {title ? <Text style={[styles.headerTitle, { color: textPrimary }]}>{title}</Text> : null}
          </View>
        )}
        <View style={styles.centerContainer}>
          <Text style={[styles.errorTitle, { color: textPrimary }]}>Unable to load screen</Text>
          <Text style={[styles.errorMessage, { color: textSecondary }]}>
            {fetchError || 'No valid URL returned.'}
          </Text>
          <Pressable onPress={loadNewDescriptor} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const safeAreaEdges = screenType === 'chat' ? (['top', 'bottom'] as const) : (['top'] as const);

  return (
    <SafeAreaView edges={safeAreaEdges} style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar
        translucent
        backgroundColor={bgColor}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      {showBack && (
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Pressable
            onPress={() => {
              if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
              } else if (onBack) {
                onBack();
              }
            }}
            hitSlop={12}
            style={styles.backButton}>
            <ArrowLeftIcon color={textPrimary} />
          </Pressable>
          {title ? (
            <Text style={[styles.headerTitle, { color: textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
        </View>
      )}
      <KeyboardAvoidingView
        style={styles.webViewWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUri }}
          javaScriptEnabled={true}
          cacheEnabled={true}
          incognito={false}
          allowsBackForwardNavigationGestures={true}
          allowFileAccess={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          originWhitelist={['*']}
          startInLoadingState={true}
          {...({
            sharedCookiesEnabled: true,
            thirdPartyCookiesEnabled: true,
            domStorageEnabled: true,
          } as any)}
          renderLoading={() => (
            <View style={[styles.centerContainer, styles.loadingOverlay, { backgroundColor: bgColor }]}>
              <ActivityIndicator size="large" color="#4162E3" />
            </View>
          )}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onError={() => {
            // When one-use bootstrap URL finishes or encounters error
          }}
          style={{ flex: 1, backgroundColor: bgColor }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  webViewWrapper: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#4162E3',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
