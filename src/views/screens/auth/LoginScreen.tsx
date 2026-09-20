import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Animated, Image, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

import { EMAIL_REGEX } from '@/constants';
import { EyeIcon, EyeSlash } from '@/svg-icons';
import { tailwind } from '@/theme';
import i18n from '@/i18n';
import { resetAuth } from '@/viewmodels/store/auth/authSlice';
import { authActions } from '@/viewmodels/store/auth/authActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useTheme } from '@/theme/useTheme';

import {
  BottomSheetBackdrop,
  BottomSheetHeader,
  LanguageList,
  Icon,
} from '@/views/components';
import {
  selectInstallationUrl,
  selectLocale,
} from '@/viewmodels/store/settings/settingsSelectors';
import { selectIsLoggingIn } from '@/viewmodels/store/auth/authSelectors';
import { setLocale } from '@/viewmodels/store/settings/settingsSlice';
import { useRefsContext } from '@/context/RefsContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

type FormData = {
  email: string;
  password: string;
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { languagesModalSheetRef } = useRefsContext();
  const { colors, isDark } = useTheme();

  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 30,
  });

  const dispatch = useAppDispatch();
  const isLoggingIn = useAppSelector(selectIsLoggingIn);

  const installationUrl = useAppSelector(selectInstallationUrl);
  const activeLocale = useAppSelector(selectLocale);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
  });

  useEffect(() => {
    languagesModalSheetRef.current?.dismiss({
      overshootClamping: true,
    });
  }, [activeLocale]);

  useEffect(() => {
    dispatch(resetAuth());
    if (!installationUrl) {
      navigation.navigate('ConfigureURL' as never);
    }
  }, [installationUrl, navigation, dispatch]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      setGoogleLoading(true);
      dispatch(authActions.loginWithGoogle({ id_token }))
        .unwrap()
        .catch(() => {})
        .finally(() => setGoogleLoading(false));
    }
  }, [response, dispatch]);

  const handleGoogleLogin = async () => {
    try {
      await promptAsync();
    } catch {
      // handled by useEffect
    }
  };

  const onSubmit = async (data: FormData) => {
    const { email, password } = data;
    dispatch(resetAuth());

    try {
      const result = await dispatch(authActions.login({ email, password })).unwrap();

      if ('mfa_required' in result && result.mfa_required) {
        navigation.navigate('MFAScreen' as never);
      }
    } catch {
      // handled by Redux
    }
  };

  const openResetPassword = () => {
    navigation.navigate('ResetPassword' as never);
  };

  const onChangeLanguage = (locale: string) => {
    i18n.locale = locale;
    dispatch(setLocale(locale));
  };

  const showGoogleButton = GOOGLE_WEB_CLIENT_ID.length > 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        translucent
        backgroundColor={colors.background}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bottomOffset={24}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 34, paddingBottom: 16 }}>
          <View style={{ flex: 1, width: '100%', maxWidth: 460, alignSelf: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Image
                // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
                source={require('@/assets/images/brand/condensed-version-graded.png')}
                style={{ width: 140, height: 40 }}
                resizeMode="contain"
              />
            </View>

            <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 26 }}>
              Sign in to Message Pro
            </Text>

          <Controller
            control={control}
            rules={{
              required: i18n.t('LOGIN.EMAIL_REQUIRED'),
              pattern: {
                value: EMAIL_REGEX,
                message: i18n.t('LOGIN.EMAIL_ERROR'),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ marginBottom: 14 }}>
                <Animated.Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginBottom: 7 }}>
                  {i18n.t('LOGIN.EMAIL')}
                </Animated.Text>
                <TextInput
                  style={{ height: 44, borderRadius: 7, borderWidth: 1, borderColor: errors.email ? '#fb7185' : colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary, paddingHorizontal: 12, fontSize: 13 }}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder={i18n.t('LOGIN.EMAIL')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                {errors.email && (
                  <Animated.Text style={{ color: '#fda4af', fontSize: 11, marginTop: 5 }}>
                    {errors.email.message}
                  </Animated.Text>
                )}
              </View>
            )}
            name="email"
          />

          <Controller
            control={control}
            rules={{
              required: i18n.t('LOGIN.PASSWORD_REQUIRED'),
              minLength: {
                value: 6,
                message: i18n.t('LOGIN.PASSWORD_ERROR'),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={{ marginBottom: 7 }}>
                <Animated.Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginBottom: 7 }}>
                  {i18n.t('LOGIN.PASSWORD')}
                </Animated.Text>
                <View style={tailwind.style('relative')}>
                  <TextInput
                  style={{ height: 44, borderRadius: 7, borderWidth: 1, borderColor: errors.password ? '#fb7185' : colors.border, backgroundColor: colors.inputBg, color: colors.textPrimary, paddingLeft: 12, paddingRight: 44, fontSize: 13 }}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  placeholder={i18n.t('LOGIN.PASSWORD')}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                />
                <Pressable
                    style={{ position: 'absolute', right: 13, top: 12 }}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Icon size={20} icon={showPassword ? <EyeIcon color={colors.textTertiary} /> : <EyeSlash color={colors.textTertiary} />} />
                  </Pressable>
                </View>
                {errors.password && (
                  <Animated.Text style={{ color: '#fda4af', fontSize: 11, marginTop: 5 }}>
                    {errors.password.message}
                  </Animated.Text>
                )}
              </View>
            )}
            name="password"
          />

          <Pressable style={{ alignSelf: 'flex-start', paddingVertical: 7, marginBottom: 9 }} onPress={openResetPassword}>
            <Animated.Text style={{ color: colors.accent, fontSize: 12, fontWeight: '600' }}>
              {i18n.t('LOGIN.FORGOT_PASSWORD')}
            </Animated.Text>
          </Pressable>

          <Pressable
            onPress={handleSubmit(onSubmit)}
            disabled={isLoggingIn}
            style={{ height: 45, borderRadius: 7, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', opacity: isLoggingIn ? 0.7 : 1 }}>
            {isLoggingIn ? <ActivityIndicator color={colors.textInverse} /> : <Text style={{ color: colors.textInverse, fontSize: 13, fontWeight: '800' }}>{i18n.t('LOGIN.LOGIN')}</Text>}
          </Pressable>

          {showGoogleButton && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ marginHorizontal: 12, color: colors.textTertiary, fontSize: 12 }}>or</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>

              <Pressable
                onPress={handleGoogleLogin}
                disabled={isLoggingIn || googleLoading || !request}
                style={{ height: 45, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10 }}>
                {googleLoading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Text style={{ fontSize: 18 }}>G</Text>
                )}
                <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{i18n.t('LOGIN.LOGIN_VIA_GOOGLE')}</Text>
              </Pressable>
            </>
          )}

          <View style={{ flex: 1, minHeight: 40 }} />

          <Animated.Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 14 }}>
            {'No account? Sign up on your desktop.'}
          </Animated.Text>
          </View>
        </KeyboardAwareScrollView>
      </View>
      <BottomSheetModal
        ref={languagesModalSheetRef}
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#626F7F' : 'rgba(0,0,0,0.3)', width: 32, height: 4, borderRadius: 11 }}
        detached
        enablePanDownToClose
        animationConfigs={animationConfigs}
        handleStyle={{ padding: 0, height: 16, paddingTop: 5 }}
        style={{ borderRadius: 26, backgroundColor: isDark ? '#1C1C1E' : '#ffffff', overflow: 'hidden' }}
        snapPoints={['70%']}>
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <BottomSheetHeader headerText={i18n.t('SETTINGS.SET_LANGUAGE')} />
          <LanguageList onChangeLanguage={onChangeLanguage} currentLanguage={activeLocale} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default LoginScreen;
