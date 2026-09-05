import React, { useEffect, useRef } from 'react';
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

const MESSAGE_LETTERS: { src: ReturnType<typeof require>; ratio: number }[] = [
  { src: require('@/assets/images/brand/letters/condensed version graded-1.png'),  ratio: 1081 / 697 },
  { src: require('@/assets/images/brand/letters/condensed version graded-2.png'),  ratio: 665 / 693  },
  { src: require('@/assets/images/brand/letters/condensed version graded-3.png'),  ratio: 525 / 694  },
  { src: require('@/assets/images/brand/letters/condensed version graded-4.png'),  ratio: 525 / 694  },
  { src: require('@/assets/images/brand/letters/condensed version graded-5.png'),  ratio: 596 / 694  },
  { src: require('@/assets/images/brand/letters/condensed version graded-6.png'),  ratio: 673 / 944  },
  { src: require('@/assets/images/brand/letters/condensed version graded-7.png'),  ratio: 665 / 693  },
];

const PRO_LETTERS: { src: ReturnType<typeof require>; ratio: number }[] = [
  { src: require('@/assets/images/brand/letters/condensed version graded-8.png'),  ratio: 703 / 940  },
  { src: require('@/assets/images/brand/letters/condensed version graded-9.png'),  ratio: 364 / 689  },
  { src: require('@/assets/images/brand/letters/condensed version graded-10.png'), ratio: 703 / 693  },
];

const calcLetterHeight = () => {
  const allLetters = [...MESSAGE_LETTERS, ...PRO_LETTERS];
  const maxWordWidth = width * 0.85;
  const maxLineWidth = Math.max(
    MESSAGE_LETTERS.reduce((sum, l) => sum + l.ratio, 0),
    PRO_LETTERS.reduce((sum, l) => sum + l.ratio, 0),
  );
  const byWidth = maxWordWidth / maxLineWidth;
  const byHeight = height * 0.07;
  return Math.min(byWidth, byHeight, 70);
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

  const messageAnims = useRef(
    MESSAGE_LETTERS.slice(1).map(() => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(50),
    }))
  ).current;

  const proAnims = useRef(
    PRO_LETTERS.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    }))
  ).current;

  useEffect(() => {
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish();
    };

    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      timers.push(setTimeout(fn, delay));
    };

    let t = 0;

    // Phase 1: M drops in
    Animated.parallel([
      Animated.timing(mOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(mTranslateY, { toValue: 0, damping: 8, stiffness: 120, mass: 1, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(mRotate, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(mRotate, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]),
      Animated.spring(mScale, { toValue: 1, damping: 6, stiffness: 80, useNativeDriver: true }),
    ]).start();

    t = 700;

    // Phase 2: "essage" letters fly in
    messageAnims.forEach(({ opacity, translateX }, idx) => {
      schedule(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.exp), useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 300, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        ]).start();
      }, t + idx * 100);
    });

    t += messageAnims.length * 100 + 300;

    // Phase 3: "pro" slides up from below
    proAnims.forEach(({ opacity, translateY }, idx) => {
      schedule(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.exp), useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, damping: 10, stiffness: 100, useNativeDriver: true }),
        ]).start();
      }, t + idx * 120);
    });

    t += proAnims.length * 120 + 600;

    schedule(finish, t);

    return () => timers.forEach(clearTimeout);
  }, []);

  const mRotateInterpolated = mRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderLetter = (
    src: ReturnType<typeof require>,
    ratio: number,
    animStyle: any,
    key: string | number,
  ) => (
    <Animated.View key={key} style={animStyle}>
      <Image
        source={src}
        style={{
          width: LETTER_HEIGHT * ratio,
          height: LETTER_HEIGHT,
          marginHorizontal: 1,
        }}
        resizeMode="contain"
      />
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* "message" row */}
      <View style={styles.wordRow}>
        {renderLetter(
          MESSAGE_LETTERS[0].src,
          MESSAGE_LETTERS[0].ratio,
          {
            opacity: mOpacity,
            transform: [
              { translateY: mTranslateY },
              { rotate: mRotateInterpolated },
              { scale: mScale },
            ],
          },
          'm',
        )}

        {MESSAGE_LETTERS.slice(1).map((letter, idx) => {
          const { opacity, translateX } = messageAnims[idx];
          return renderLetter(letter.src, letter.ratio, { opacity, transform: [{ translateX }] }, idx);
        })}
      </View>

      {/* "pro" row */}
      <View style={[styles.wordRow, { marginTop: 20 }]}>
        {PRO_LETTERS.map((letter, idx) => {
          const { opacity, translateY } = proAnims[idx];
          return renderLetter(letter.src, letter.ratio, { opacity, transform: [{ translateY }] }, `pro-${idx}`);
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
