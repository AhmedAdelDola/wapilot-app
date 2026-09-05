import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width } = Dimensions.get('window');

const ICONS = [
  require('@/assets/images/brand/solid.png'),
  require('@/assets/images/brand/graded.png'),
  require('@/assets/images/brand/condensed-white.png'),
  require('@/assets/images/brand/condensed-black.png'),
];

type AnimatedSplashProps = {
  onFinish: () => void;
};

export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    const totalIcons = ICONS.length;
    const iconDuration = 800;

    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      SplashScreen.hideAsync().catch(() => {});
      onFinish();
    };

    const animateNext = () => {
      fadeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(iconDuration - 600),
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        stepRef.current++;
        if (stepRef.current < totalIcons) {
          setCurrentIndex(stepRef.current);
          animateNext();
        } else {
          finish();
        }
      });
    };

    const safetyTimeout = setTimeout(finish, totalIcons * iconDuration + 1000);
    animateNext();

    return () => clearTimeout(safetyTimeout);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#101113' : '#ffffff' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image source={ICONS[currentIndex]} style={styles.icon} resizeMode="contain" />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { justifyContent: 'center', alignItems: 'center' },
  icon: { width: width * 0.35, height: width * 0.35 },
});
