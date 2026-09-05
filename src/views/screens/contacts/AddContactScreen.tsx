import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { contactService } from '@/models/services/contactService';
import { useTheme } from '@/theme';

const ArrowLeftIcon = ({ color = '#282E34' }: { color?: string }) => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19l-7-7 7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = ({ color = '#626F7F' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

type AddContactScreenProps = {
  onBack: () => void;
};

const AddContactScreen = ({ onBack }: AddContactScreenProps) => {
  const { isDark } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName && !phone && !email) {
      Alert.alert('Validation Error', 'Please enter at least a name, phone number, or email.');
      return;
    }
    try {
      setSaving(true);
      await contactService.createContact({
        name: fullName || 'New Contact',
        email: email.trim() || undefined,
        phone_number: phone.trim() || undefined,
      });
      Alert.alert('Success', 'Contact created successfully!');
      onBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create contact');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%' as const,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: isDark ? '#24262B' : '#EAEAEA',
    borderRadius: 12,
    backgroundColor: isDark ? '#1B1C20' : '#ffffff',
    color: isDark ? '#EDEEF0' : '#626F7F',
    fontSize: 14,
  };

  const labelStyle = { fontWeight: '600' as const, color: isDark ? '#EDEEF0' : '#282E34', marginBottom: 6, fontSize: 14 };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: isDark ? '#101113' : '#ffffff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? '#24262B' : '#F0F0F3' }}>
        <Pressable onPress={onBack} hitSlop={8}>
          <ArrowLeftIcon color={isDark ? '#EDEEF0' : '#282E34'} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#EDEEF0' : '#282E34' }}>Add Contact</Text>
        <Pressable onPress={handleSave} disabled={saving} hitSlop={8}>
          {saving ? (
            <ActivityIndicator size="small" color="#725AFF" />
          ) : (
            <Text style={{ color: '#725AFF', fontWeight: '600', fontSize: 14 }}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32 }} contentContainerStyle={{ gap: 20 }}>
        <View>
          <Text style={labelStyle}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} placeholder="Add First Name" placeholderTextColor={isDark ? '#80838D' : '#80838D'} style={inputStyle} />
        </View>
        <View>
          <Text style={labelStyle}>Last Name</Text>
          <TextInput value={lastName} onChangeText={setLastName} placeholder="Add Last Name" placeholderTextColor={isDark ? '#80838D' : '#80838D'} style={inputStyle} />
        </View>
        <View>
          <Text style={labelStyle}>Phone</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDark ? '#24262B' : '#EAEAEA', borderRadius: 12, overflow: 'hidden', backgroundColor: isDark ? '#1B1C20' : '#ffffff' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 14, borderRightWidth: 1, borderRightColor: isDark ? '#24262B' : '#EAEAEA' }}>
              <Text style={{ fontSize: 14, color: isDark ? '#EDEEF0' : '#626F7F' }}>📞</Text>
              <ChevronDown color={isDark ? '#EDEEF0' : '#626F7F'} />
            </View>
            <TextInput value={phone} onChangeText={setPhone} placeholder="Add Phone Number" placeholderTextColor={isDark ? '#80838D' : '#80838D'} keyboardType="phone-pad" style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 14, color: isDark ? '#EDEEF0' : '#626F7F', fontSize: 14 }} />
          </View>
        </View>
        <View>
          <Text style={labelStyle}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="Add Email" placeholderTextColor={isDark ? '#80838D' : '#80838D'} keyboardType="email-address" style={inputStyle} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddContactScreen;
