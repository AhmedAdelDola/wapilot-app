import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import i18n from '@/i18n';

type AnimatedSplashProps = { onFinish: () => void };

export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#0D0D0D' : '#FAFAFA';
  const mutedColor = isDark ? '#AEB5C9' : '#626262';

  const lang = (i18n.locale || 'ar').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const statusText = lang === 'ar' ? 'جارٍ تجهيز مساحة عملك' : 'Preparing your workspace';

  const finishedRef = useRef(false);

  // Animation values
  const p1Progress = useRef(new Animated.Value(0)).current;
  const p2Progress = useRef(new Animated.Value(0)).current;
  const p3Progress = useRef(new Animated.Value(0)).current;
  const markHomeProgress = useRef(new Animated.Value(0)).current;
  const wordmarkProgress = useRef(new Animated.Value(0)).current;
  const shakeProgress = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Geometry matching the SVG 3528 x 703 design
  const logoWidth = Math.min(width * 0.68, 292);
  const logoHeight = logoWidth * (703 / 3528);
  const scale = logoWidth / 3528;
  const ratio = logoWidth / 292; // for pixel-based CSS keyframes

  const p1W = Math.round(428 * scale);
  const p2W = Math.round(428 * scale);
  const p3W = Math.round(434 * scale);
  const markW = p1W + p2W + p3W;
  const wordmarkW = logoWidth - markW;

  const logoSource = isDark
    ? require('@/assets/images/brand/fulllogobabywhite.png')
    : require('@/assets/images/brand/fulllogobabyblue2.png');

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  const fadeOutAndFinish = () => {
    if (finishedRef.current) return;
    Animated.timing(containerOpacity, {
      toValue: 0,
      duration: 350,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => finish());
  };

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    // Main animation timeline reproducing the approved splash CSS keyframes
    const animation = Animated.parallel([
      // Piece 1 (Left Leg) entrance: 0ms -> 620ms
      Animated.timing(p1Progress, {
        toValue: 1,
        duration: 620,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }),

      // Piece 2 (Middle Leg) entrance: delay 70ms, duration 620ms
      Animated.sequence([
        Animated.delay(70),
        Animated.timing(p2Progress, {
          toValue: 1,
          duration: 620,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
      ]),

      // Piece 3 (Right Leg) entrance: delay 140ms, duration 620ms
      Animated.sequence([
        Animated.delay(140),
        Animated.timing(p3Progress, {
          toValue: 1,
          duration: 620,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
      ]),

      // Mark Home glide: starts at 820ms, duration 440ms
      Animated.sequence([
        Animated.delay(820),
        Animated.timing(markHomeProgress, {
          toValue: 1,
          duration: 440,
          easing: Easing.bezier(0.65, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),

      // Wordmark slide-in: starts at 1220ms, duration 460ms
      Animated.sequence([
        Animated.delay(1220),
        Animated.timing(wordmarkProgress, {
          toValue: 1,
          duration: 460,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
          useNativeDriver: true,
        }),
      ]),

      // M-Shake: starts at 2400ms, duration 600ms
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(shakeProgress, {
          toValue: 1,
          duration: 600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start(() => finish());

    // Safety fallback
    const fallbackTimer = setTimeout(finish, 4000);
    return () => {
      animation.stop();
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Interpolations matching the CSS keyframes exactly
  const p1TranslateX = p1Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-210 * ratio, 0],
  });
  const p1TranslateY = p1Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [180 * ratio, 0],
  });
  const p1Rotate = p1Progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '0deg'],
  });
  const p1Opacity = p1Progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 1, 1],
  });

  const p2TranslateX = p2Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [20 * ratio, 0],
  });
  const p2TranslateY = p2Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-230 * ratio, 0],
  });
  const p2Rotate = p2Progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['8deg', '0deg'],
  });
  const p2Opacity = p2Progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 1, 1],
  });

  const p3TranslateX = p3Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [240 * ratio, 0],
  });
  const p3TranslateY = p3Progress.interpolate({
    inputRange: [0, 1],
    outputRange: [160 * ratio, 0],
  });
  const p3Rotate = p3Progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['12deg', '0deg'],
  });
  const p3Opacity = p3Progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 1, 1],
  });

  // Mark glide to home (starts centered at 31.7177% with 1.08 scale, glides to 0 at scale 1)
  const markHomeTranslateX = markHomeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [logoWidth * 0.317177, 0],
  });
  const markHomeScale = markHomeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.08, 1],
  });

  // Wordmark slide in from +90px
  const wordmarkTranslateX = wordmarkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [90 * ratio, 0],
  });

  // M subtle damped shake keyframes
  const shakeTranslateX = shakeProgress.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
    outputRange: [
      0,
      -24 * ratio,
      21 * ratio,
      -16 * ratio,
      11 * ratio,
      -6 * ratio,
      2 * ratio,
      0,
    ],
  });
  const shakeRotate = shakeProgress.interpolate({
    inputRange: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
    outputRange: ['0deg', '-4deg', '3.5deg', '-2.6deg', '1.8deg', '-0.9deg', '0.3deg', '0deg'],
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor: bg, opacity: containerOpacity }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <Pressable style={styles.centerBox} onPress={fadeOutAndFinish}>
        {/* Full Logo Container */}
        <View style={{ width: logoWidth, height: logoHeight, flexDirection: 'row' }}>
          {/* Animated M Mark Container (Home glide + Shake) */}
          <Animated.View
            style={{
              width: markW,
              height: logoHeight,
              flexDirection: 'row',
              transform: [
                { translateX: Animated.add(markHomeTranslateX, shakeTranslateX) },
                { scale: markHomeScale },
                { rotate: shakeRotate },
              ],
            }}>
            {/* Piece 1: Left Leg (width: 428 / 3528) */}
            <Animated.View
              style={{
                width: p1W,
                height: logoHeight,
                overflow: 'hidden',
                opacity: p1Opacity,
                transform: [
                  { translateX: p1TranslateX },
                  { translateY: p1TranslateY },
                  { rotate: p1Rotate },
                ],
              }}>
              <Image
                source={logoSource}
                style={{ width: logoWidth, height: logoHeight, position: 'absolute', left: 0, top: 0 }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Piece 2: Middle Leg (width: 428 / 3528) */}
            <Animated.View
              style={{
                width: p2W,
                height: logoHeight,
                overflow: 'hidden',
                opacity: p2Opacity,
                transform: [
                  { translateX: p2TranslateX },
                  { translateY: p2TranslateY },
                  { rotate: p2Rotate },
                ],
              }}>
              <Image
                source={logoSource}
                style={{
                  width: logoWidth,
                  height: logoHeight,
                  position: 'absolute',
                  left: -p1W,
                  top: 0,
                }}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Piece 3: Right Leg (width: 434 / 3528) */}
            <Animated.View
              style={{
                width: p3W,
                height: logoHeight,
                overflow: 'hidden',
                opacity: p3Opacity,
                transform: [
                  { translateX: p3TranslateX },
                  { translateY: p3TranslateY },
                  { rotate: p3Rotate },
                ],
              }}>
              <Image
                source={logoSource}
                style={{
                  width: logoWidth,
                  height: logoHeight,
                  position: 'absolute',
                  left: -(p1W + p2W),
                  top: 0,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>

          {/* Wordmark: "Message Pro" (width: 2238 / 3528) */}
          <Animated.View
            style={{
              width: wordmarkW,
              height: logoHeight,
              overflow: 'hidden',
              opacity: wordmarkProgress,
              transform: [{ translateX: wordmarkTranslateX }],
            }}>
            <Image
              source={logoSource}
              style={{
                width: logoWidth,
                height: logoHeight,
                position: 'absolute',
                left: -markW,
                top: 0,
              }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </Pressable>

      {/* Status indicator matching the approved splash HTML */}
      <Text style={[styles.status, { color: mutedColor }]}>{statusText}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -18 }],
  },
  status: {
    position: 'absolute',
    bottom: 44,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 23,
    fontFamily: 'System',
  },
});
