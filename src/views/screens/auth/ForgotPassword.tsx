import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Animated, StatusBar, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon } from '@/views/components';
import { EMAIL_REGEX } from '@/constants';
import { KeyRoundIcon } from '@/svg-icons';
import { useTheme } from '@/theme/useTheme';
import { authActions } from '@/viewmodels/store/auth/authActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { resetAuth } from '@/viewmodels/store/auth/authSlice';
import {
  selectResetPasswordLoading,
  selectResetPasswordSuccess,
  selectAuthError,
} from '@/viewmodels/store/auth/authSelectors';
import AnalyticsHelper from '@/utils/analyticsUtils';
import { ACCOUNT_EVENTS } from '@/constants/analyticsEvents';
import i18n from '@/i18n';

type FormData = {
  email: string;
};

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();
  const isLoading = useAppSelector(selectResetPasswordLoading);
  const isSuccess = useAppSelector(selectResetPasswordSuccess);
  const error = useAppSelector(selectAuthError);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    dispatch(resetAuth());
  }, [dispatch]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    if (cooldown > 0 || isLoading) return;
    const { email } = data;
    dispatch(authActions.resetPassword({ email }));
    setCooldown(30);
    AnalyticsHelper.track(ACCOUNT_EVENTS.FORGOT_PASSWORD);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
      <StatusBar
        translucent
        backgroundColor={isDark ? '#0f172a' : '#ffffff'}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64 }}>
          <Icon icon={<KeyRoundIcon stroke={isDark ? '#94a3b8' : '#858585'} />} size={40} />
          <View style={{ paddingTop: 24, gap: 16 }}>
            <Animated.Text style={{ color: isDark ? '#f8fafc' : '#111827', fontSize: 24, fontWeight: '600' }}>
              {i18n.t('FORGOT_PASSWORD.TITLE')}
            </Animated.Text>
            <Animated.Text style={{ fontSize: 15, lineHeight: 22, color: isDark ? '#94a3b8' : '#374151' }}>
              {i18n.t('FORGOT_PASSWORD.SUB_TITLE')}
            </Animated.Text>
          </View>

          {isSuccess ? (
            <View style={{ marginTop: 40, alignItems: 'center', gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                <Animated.Text style={{ fontSize: 28 }}>✓</Animated.Text>
              </View>
              <Animated.Text style={{ color: isDark ? '#f8fafc' : '#111827', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
                {i18n.t('FORGOT_PASSWORD.API_SUCCESS')}
              </Animated.Text>
            </View>
          ) : (
            <>
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
                  <View style={{ paddingTop: 32, marginBottom: 32, gap: 8 }}>
                    <Animated.Text style={{ color: isDark ? '#f8fafc' : '#111827', fontSize: 14, fontWeight: '500' }}>
                      {i18n.t('LOGIN.EMAIL')}
                    </Animated.Text>
                    <TextInput
                      style={{
                        height: 44,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: errors.email ? '#ef4444' : isDark ? '#334155' : '#e5e7eb',
                        backgroundColor: isDark ? '#1e293b' : '#f9fafb',
                        color: isDark ? '#f8fafc' : '#111827',
                        paddingHorizontal: 12,
                        fontSize: 15,
                      }}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    {errors.email && (
                      <Animated.Text style={{ color: '#ef4444', fontSize: 12 }}>
                        {errors.email.message}
                      </Animated.Text>
                    )}
                  </View>
                )}
                name="email"
              />

              {error && (
                <Animated.Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
                  {error}
                </Animated.Text>
              )}

              {isLoading ? (
                <View style={{ height: 45, borderRadius: 7, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color="#ffffff" />
                </View>
              ) : (
                <Button
                  text={cooldown > 0 ? `Resend in ${cooldown}s` : i18n.t('FORGOT_PASSWORD.RESET_HERE')}
                  handlePress={handleSubmit(onSubmit)}
                  disabled={cooldown > 0}
                />
              )}
            </>
          )}
        </Animated.ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ForgotPassword;
