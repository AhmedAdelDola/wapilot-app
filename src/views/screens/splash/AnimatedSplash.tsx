import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';

const { height, width } = Dimensions.get('window');

const LETTERS: { src: ReturnType<typeof require>; ratio: number }[] = [
  { src: require('@/assets/images/brand/letters/condensed version graded-1.png'),  ratio: 1081 / 697 },
  { src: require('@/assets/images/brand/letters/condensed version graded-2.png'),  ratio: 665 / 693  },
  { src: require('@/assets/images/brand/letters/condensed version graded-3.png'),  ratio: 525 / 694  },
  { src: require('@/assets/images/brand/letters/condensed version graded-4.png'),  ratio: 525 / 694  },
  { src: require('@/assets/images/brand/letters/condensed version graded-5.png'),  ratio: 596 / 694  },
  { src: require('@/assets/images/brand/letters/condensed version graded-6.png'),  ratio: 673 / 944  },
  { src: require('@/assets/images/brand/letters/condensed version graded-7.png'),  ratio: 665 / 693  },
  { src: require('@/assets/images/brand/letters/condensed version graded-8.png'),  ratio: 703 / 940  },
  { src: require('@/assets/images/brand/letters/condensed version graded-9.png'),  ratio: 364 / 689  },
  { src: require('@/assets/images/brand/letters/condensed version graded-10.png'), ratio: 703 / 693  },
];

const calcLetterHeight = () => {
  const maxWordWidth = width * 0.85;
  const totalRatio = LETTERS.reduce((sum, l) => sum + l.ratio, 0);
  const byWidth = maxWordWidth / totalRatio;
  const byHeight = height * 0.08;
  return Math.min(byWidth, byHeight, 80);
};

type AnimatedSplashProps = { onFinish: () => void };

export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#101113' : '#ffffff';

  const finishedRef = useRef(false);
  const LETTER_HEIGHT = useRef(calcLetterHeight()).current;

  const mScale = useRef(new Animated.Value(0.3)).current;
  const mOpacity = useRef(new Animated.Value(0)).current;
  const mTranslateY = useRef(new Animated.Value(-height * 0.35)).current;
  const mRotate = useRef(new Animated.Value(0)).current;

  const letterAnims = useRef(
    LETTERS.slice(1).map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(50),
    }))
  ).current;

  useEffect(() => {
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const timers: NodeJS.Timeout[] = [];

    const schedule = (fn: () => void, delay: number) => {
      const t = setTimeout(fn, delay);
      timers.push(t);
      return t;
    };

    let cumDelay = 0;

    // Phase 1: M drops in (0 → ~600ms)
    mOpacity.setValue(0);
    mTranslateY.setValue(-height * 0.35);
    mRotate.setValue(0);
    mScale.setValue(0.3);

    Animated.parallel([
      Animated.timing(mOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(mTranslateY, { toValue: 0, damping: 8, stiffness: 120, mass: 1, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(mRotate, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mRotate, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
      Animated.spring(mScale, { toValue: 1, damping: 6, stiffness: 80, useNativeDriver: true }),
    ]).start();

    cumDelay = 700;

    // Phase 2: Letters fly in (staggered)
    letterAnims.forEach(({ opacity, translateX }, idx) => {
      schedule(() => {
        opacity.setValue(0);
        translateX.setValue(50);
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.exp), useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 300, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        ]).start();
      }, cumDelay + idx * 100);
    });

    cumDelay += (letterAnims.length) * 100 + 400;

    // Finish after all animations
    schedule(finish, cumDelay);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  const mRotateInterpolated = mRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <View style={styles.wordRow}>
        <Animated.View
          style={{
            opacity: mOpacity,
            transform: [
              { translateY: mTranslateY },
              { rotate: mRotateInterpolated },
              { scale: mScale },
            ],
          }}
        >
          <Image
            source={LETTERS[0].src}
            style={{
              width: LETTER_HEIGHT * LETTERS[0].ratio,
              height: LETTER_HEIGHT,
              marginHorizontal: 1,
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {LETTERS.slice(1).map((letter, idx) => {
          const { opacity, translateX } = letterAnims[idx];
          return (
            <Animated.View
              key={idx}
              style={{ opacity, transform: [{ translateX }] }}
            >
              <Image
                source={letter.src}
                style={{
                  width: LETTER_HEIGHT * letter.ratio,
                  height: LETTER_HEIGHT,
                  marginHorizontal: 1,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
