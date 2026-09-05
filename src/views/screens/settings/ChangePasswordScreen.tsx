import React, { useState, useCallback } from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { tailwind } from '@/theme';
import { showToast } from '@/utils/toastUtils';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [existingPassword, setExistingPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!existingPassword) {
      newErrors.existingPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must include an uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      newErrors.newPassword = 'Password must include a lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.newPassword = 'Password must include a number';
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      newErrors.newPassword = 'Password must include a special character';
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [existingPassword, newPassword, confirmPassword]);

  const handleChangePassword = useCallback(() => {
    if (!validate()) return;

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast({ message: 'Password updated successfully' });
      navigation.goBack();
    }, 500);
  }, [validate, navigation]);

  const hasChanges = existingPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('flex-row items-center justify-between px-4 py-3 border-b border-gray-100')}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={16}>
          <Text style={tailwind.style('text-xl')}>{'\u2715'}</Text>
        </Pressable>
        <Text style={tailwind.style('text-[18px] font-inter-580-24 text-gray-950')}>
          Change password
        </Text>
        <Pressable
          onPress={handleChangePassword}
          disabled={!hasChanges || isSaving}
          hitSlop={16}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#626F7F" />
          ) : (
            <Text
              style={tailwind.style(
                'text-[16px] font-inter-normal-20',
                hasChanges ? 'text-blue-500' : 'text-gray-400',
              )}>
              Save
            </Text>
          )}
        </Pressable>
      </View>

      <View style={tailwind.style('px-6 pt-6')}>
        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Existing Password
        </Text>
        <TextInput
          style={tailwind.style(
            'border rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-1',
            errors.existingPassword ? 'border-red-300' : 'border-gray-200',
          )}
          value={existingPassword}
          onChangeText={text => {
            setExistingPassword(text);
            if (errors.existingPassword) {
              setErrors(prev => ({ ...prev, existingPassword: '' }));
            }
          }}
          placeholder="Enter current password"
          placeholderTextColor="#80838D"
          secureTextEntry
        />
        {errors.existingPassword ? (
          <Text style={tailwind.style('text-[12px] text-red-500 mb-4')}>{errors.existingPassword}</Text>
        ) : (
          <View style={tailwind.style('mb-4')} />
        )}

        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          New Password
        </Text>
        <TextInput
          style={tailwind.style(
            'border rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-1',
            errors.newPassword ? 'border-red-300' : 'border-gray-200',
          )}
          value={newPassword}
          onChangeText={text => {
            setNewPassword(text);
            if (errors.newPassword) {
              setErrors(prev => ({ ...prev, newPassword: '' }));
            }
          }}
          placeholder="Enter new password"
          placeholderTextColor="#80838D"
          secureTextEntry
        />
        {errors.newPassword ? (
          <Text style={tailwind.style('text-[12px] text-red-500 mb-4')}>{errors.newPassword}</Text>
        ) : (
          <View style={tailwind.style('mb-4')} />
        )}

        <Text style={tailwind.style('text-[14px] font-inter-medium-24 text-gray-950 mb-2')}>
          Confirm New Password
        </Text>
        <TextInput
          style={tailwind.style(
            'border rounded-lg px-4 py-3.5 text-[16px] font-inter-normal-20 text-gray-950 mb-1',
            errors.confirmPassword ? 'border-red-300' : 'border-gray-200',
          )}
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            if (errors.confirmPassword) {
              setErrors(prev => ({ ...prev, confirmPassword: '' }));
            }
          }}
          placeholder="Confirm new password"
          placeholderTextColor="#80838D"
          secureTextEntry
        />
        {errors.confirmPassword ? (
          <Text style={tailwind.style('text-[12px] text-red-500 mb-4')}>{errors.confirmPassword}</Text>
        ) : (
          <View style={tailwind.style('mb-4')} />
        )}

        <Text style={tailwind.style('text-[13px] font-inter-normal-20 text-gray-500 leading-5')}>
          Your password must be at least 8 characters long, include a number, an uppercase letter, a special character and a lowercase letter.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ChangePasswordScreen;
