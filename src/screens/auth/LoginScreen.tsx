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

import { EMAIL_REGEX } from '@/constants';
import { EyeIcon, EyeSlash, LockIcon, TranslateIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import i18n from '@/i18n';
import { resetAuth } from '@/store/auth/authSlice';
import { authActions } from '@/store/auth/authActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useTheme } from '@/theme/useTheme';

import {
  BottomSheetBackdrop,
  BottomSheetHeader,
  LanguageList,
  Icon,
} from '@/components-next';
import {
  selectInstallationUrl,
  selectBaseUrl,
  selectLocale,
} from '@/store/settings/settingsSelectors';
import { selectIsLoggingIn } from '@/store/auth/authSelectors';
import { setLocale } from '@/store/settings/settingsSlice';
import { useRefsContext } from '@/context/RefsContext';
import { SsoUtils } from '@/utils/ssoUtils';

type FormData = {
  email: string;
  password: string;
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
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
  const baseUrl = useAppSelector(selectBaseUrl);
  const activeLocale = useAppSelector(selectLocale);

  useEffect(() => {
    languagesModalSheetRef.current?.dismiss({
      overshootClamping: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocale]);

  useEffect(() => {
    dispatch(resetAuth());
    if (!installationUrl) {
      navigation.navigate('ConfigureURL' as never);
    }
  }, [installationUrl, navigation, dispatch]);

  const onSubmit = async (data: FormData) => {
    const { email, password } = data;
    // Clear any existing auth state before login
    dispatch(resetAuth());

    try {
      const result = await dispatch(authActions.login({ email, password })).unwrap();

      // Check if MFA is required in the response
      if ('mfa_required' in result && result.mfa_required) {
        // Navigate directly to MFA screen with the token
        navigation.navigate('MFAScreen' as never);
      }
      // If MFA not required, the auth state will be updated and
      // the app will automatically navigate to the dashboard
    } catch {
      // Login error is handled by Redux and displayed in the UI
    }
  };

  // TODO: Change this condition based on EE check
  // Show SSO login button only if installation URL contains omni.message-pro.com
  const showSsoLogin = installationUrl.includes('omni.message-pro.com');

  const openResetPassword = () => {
    navigation.navigate('ResetPassword' as never);
  };

  const onChangeLanguage = (locale: string) => {
    i18n.locale = locale;
    dispatch(setLocale(locale));
  };

  const handleSsoLogin = async () => {
    if (!installationUrl) {
      return;
    }

    try {
      const result = await SsoUtils.loginWithSSO(installationUrl);

      if (result.type === 'success' && result.url) {
        const ssoParams = SsoUtils.parseCallbackUrl(result.url);
        await SsoUtils.handleSsoCallback(ssoParams, dispatch);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // SSO login error handled silently
    }
  };

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
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Image
                // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
                source={require('@/assets/images/logo.png')}
                style={{ width: 23, height: 23, borderRadius: 7, marginRight: 6 }}
                resizeMode="contain"
              />
              <Text style={{ color: colors.textPrimary, fontSize: 17, fontWeight: '800', letterSpacing: -0.4 }}>
                message.pro
              </Text>
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
                  style={{ height: 44, borderRadius: 7, borderWidth: 1, borderColor: errors.email ? '#fb7185' : colors.border, color: colors.textPrimary, paddingHorizontal: 12, fontSize: 13 }}
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
                  style={{ height: 44, borderRadius: 7, borderWidth: 1, borderColor: errors.password ? '#fb7185' : colors.border, color: colors.textPrimary, paddingLeft: 12, paddingRight: 44, fontSize: 13 }}
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
                    <Icon size={20} icon={showPassword ? <EyeIcon /> : <EyeSlash />} />
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

          <View style={{ flex: 1, minHeight: 96 }} />

          {showSsoLogin ? (
            <Pressable onPress={handleSsoLogin} disabled={isLoggingIn} style={{ height: 44, borderRadius: 7, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{i18n.t('LOGIN.LOGIN_VIA_SSO')}</Text>
            </Pressable> 
          ) : null}

         

          {/* Static footer message - replace the string below with whatever text you want */}
          <Animated.Text style={{ color: colors.textTertiary, fontSize: 12, textAlign: 'center', marginTop: 14 }}>
            {'No account? Sign up on your desktop.'}
          </Animated.Text>
          </View>
        </KeyboardAwareScrollView>
      </View>
      <BottomSheetModal
        ref={languagesModalSheetRef}
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
        detached
        enablePanDownToClose
        animationConfigs={animationConfigs}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
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
