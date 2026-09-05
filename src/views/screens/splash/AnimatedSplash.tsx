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
import * as SplashScreen from 'expo-splash-screen';

const { height } = Dimensions.get('window');

const LETTER_HEIGHT = height * 0.13;

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

const M_ANIM_DURATION = 800;
const M_SETTLE_PAUSE = 200;
const LETTER_STAGGER = 100;
const LETTER_FLY_DUR = 300;

type AnimatedSplashProps = { onFinish: () => void };

export const AnimatedSplash = ({ onFinish }: AnimatedSplashProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bg = isDark ? '#101113' : '#ffffff';

  const finishedRef = useRef(false);

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
      SplashScreen.hideAsync().catch(() => {});
      onFinish();
    };

    const safetyMs =
      M_ANIM_DURATION + M_SETTLE_PAUSE + (LETTERS.length - 1) * LETTER_STAGGER + LETTER_FLY_DUR + 1500;
    const safetyTimeout = setTimeout(finish, safetyMs);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(mOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(mTranslateY, {
          toValue: 0,
          damping: 8,
          stiffness: 120,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(mRotate, {
            toValue: 1,
            duration: M_ANIM_DURATION * 0.6,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(mRotate, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(mScale, {
          toValue: 1,
          damping: 6,
          stiffness: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(M_SETTLE_PAUSE),

      Animated.stagger(
        LETTER_STAGGER,
        letterAnims.map(({ opacity, translateX }) =>
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: LETTER_FLY_DUR,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: LETTER_FLY_DUR,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }),
          ])
        )
      ),

      Animated.delay(800),
    ]).start(() => {
      clearTimeout(safetyTimeout);
      finish();
    });

    return () => clearTimeout(safetyTimeout);
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
            style={[
              styles.letter,
              {
                width: LETTER_HEIGHT * LETTERS[0].ratio,
                height: LETTER_HEIGHT,
              },
            ]}
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
                style={[
                  styles.letter,
                  {
                    width: LETTER_HEIGHT * letter.ratio,
                    height: LETTER_HEIGHT,
                  },
                ]}
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
    flexWrap: 'nowrap',
  },
  letter: {
    marginHorizontal: 1,
  },
});
