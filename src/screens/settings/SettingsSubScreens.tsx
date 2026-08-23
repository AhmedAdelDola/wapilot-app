import React, { useState } from 'react';
import { Pressable, StatusBar, Text, TextInput, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

// ---------- Shared icons ----------
const ArrowLeft = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <Path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const XIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

const ChevronDown = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const SearchSmall = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
    <Path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ---------- Toggle ----------
const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <Pressable onPress={onToggle} style={{ width: 48, height: 24, borderRadius: 999, backgroundColor: on ? '#3b82f6' : '#d1d5db', justifyContent: 'center', paddingHorizontal: 2 }}>
    <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: 'white', alignSelf: on ? 'flex-end' : 'flex-start' }} />
  </Pressable>
);

// ---------- Shared header ----------
import { useNavigation } from '@react-navigation/native';

const SubHeader = ({ title, right }: { title: string; right?: React.ReactNode }) => {
  const navigation = useNavigation<any>();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <ArrowLeft />
      </Pressable>
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{title}</Text>
      <View style={{ width: 32 }}>
        {right}
      </View>
    </View>
  );
};

// ---------- Update Notifications ----------
export const UpdateNotificationsScreen = () => {
  const [mobilePush, setMobilePush] = useState(true);
  const [callSounds, setCallSounds] = useState(true);
  const [chatSounds, setChatSounds] = useState(true);
  const [offlineOnly, setOfflineOnly] = useState(false);

  const dropdown = { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginTop: 8 };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <SubHeader title="Update notifications" right={<Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Change</Text>} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 24 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>Mobile Push Notification</Text>
            <Toggle on={mobilePush} onToggle={() => setMobilePush(!mobilePush)} />
          </View>
          <Pressable style={dropdown}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>For all contacts and mentions</Text>
            <ChevronDown />
          </Pressable>
          <Pressable onPress={() => setOfflineOnly(!offlineOnly)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: offlineOnly ? '#3b82f6' : 'white', alignItems: 'center', justifyContent: 'center' }}>
              {offlineOnly && <Path d="M5 12l4 4 10-10" stroke="white" strokeWidth={2} />}
            </View>
            <Text style={{ fontSize: 14, color: '#374151' }}>Only send mobile notifications when I am Offline</Text>
          </Pressable>
        </View>
        <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>In-app Call Sounds</Text>
            <Toggle on={callSounds} onToggle={() => setCallSounds(!callSounds)} />
          </View>
          <Pressable style={dropdown}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>Play for Contacts assigned to me and unassigned contacts</Text>
            <ChevronDown />
          </Pressable>
        </View>
        <View style={{ height: 1, backgroundColor: '#f3f4f6' }} />
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>In-app Chat Sounds</Text>
            <Toggle on={chatSounds} onToggle={() => setChatSounds(!chatSounds)} />
          </View>
          <Pressable style={dropdown}>
            <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>For contacts assigned to me or unassigned contacts</Text>
            <ChevronDown />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Change Password ----------
export const ChangePasswordScreen = () => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const inputCls = { width: '100%', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, color: '#374151', fontSize: 14 } as const;
  const labelCls = { fontWeight: '600', color: '#111827', marginBottom: 6, fontSize: 14 } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <SubHeader title="Change password" right={<Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Change</Text>} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32, gap: 20 }}>
        <View>
          <Text style={labelCls}>Existing Password</Text>
          <TextInput secureTextEntry value={current} onChangeText={setCurrent} placeholder="Enter current password" placeholderTextColor="#9ca3af" style={inputCls} />
        </View>
        <View>
          <Text style={labelCls}>New Password</Text>
          <TextInput secureTextEntry value={next} onChangeText={setNext} placeholder="Enter new password" placeholderTextColor="#9ca3af" style={inputCls} />
        </View>
        <View>
          <Text style={labelCls}>Confirm New Password</Text>
          <TextInput secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Confirm new password" placeholderTextColor="#9ca3af" style={inputCls} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', lineHeight: 20 }}>
          Your password must be at least 8 characters long, include a number, an uppercase letter, a special character and a lowercase letter.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Profile ----------
export const ProfileScreen = () => {
  const [firstName, setFirstName] = useState('Ahmed');
  const [lastName, setLastName] = useState('Adel');

  const inputCls = { width: '100%', paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, color: '#374151', fontSize: 14, fontWeight: '500' as const } as const;
  const labelCls = { fontWeight: '600', color: '#111827', marginBottom: 6, fontSize: 14 } as const;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <SubHeader title="Profile" right={<Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Change</Text>} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ color: 'white', fontSize: 30, fontWeight: '700' }}>A</Text>
          </View>
          <Text style={{ fontWeight: '700', color: '#111827', fontSize: 18 }}>Ahmed Adel</Text>
          <Text style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>dola02264@gmail.com</Text>
          <Pressable style={{ borderWidth: 1, borderColor: '#60a5fa', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10, width: '100%' }}>
            <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '500', textAlign: 'center' }}>Change Profile</Text>
          </Pressable>
        </View>
        <View style={{ gap: 20 }}>
          <View>
            <Text style={labelCls}>First Name</Text>
            <TextInput value={firstName} onChangeText={setFirstName} style={inputCls} />
          </View>
          <View>
            <Text style={labelCls}>Last Name</Text>
            <TextInput value={lastName} onChangeText={setLastName} style={inputCls} />
          </View>
          <View>
            <Text style={labelCls}>Email</Text>
            <TextInput value="dola02264@gmail.com" editable={false} style={[inputCls, { color: '#9ca3af' }]} />
          </View>
          <View>
            <Text style={labelCls}>Language</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>🇬🇧</Text>
                <Text style={{ color: '#374151', fontSize: 14, fontWeight: '500' }}>English</Text>
              </View>
              <ChevronDown />
            </View>
            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>All languages are currently in beta, with the exception of English.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ---------- Change Workspace ----------
export const ChangeWorkspaceScreen = () => {
  const [query, setQuery] = useState('');
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <SubHeader title="Change workspace" />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 }}>
          <SearchSmall />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search" placeholderTextColor="#9ca3af" style={{ flex: 1, color: '#374151', fontSize: 14 }} />
        </View>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: '#93c5fd', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>w</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: '#111827' }}>wapilot</Text>
            <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 }}>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>My New</Text>
            </View>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

// ---------- Dark Mode ----------
export const DarkModeScreen = () => {
  const [selected, setSelected] = useState(0);
  const options = ['Use system settings', 'Light', 'Dark'];
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <SubHeader title="Dark mode" right={<Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Change</Text>} />
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 12 }}>Use system settings</Text>
        {options.map((opt, i) => (
          <Pressable key={i} onPress={() => setSelected(i)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
            <Text style={{ color: '#374151' }}>{opt}</Text>
            {selected === i && <CheckIcon />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
};

// ---------- Report a Bug ----------
export const ReportBugScreen = () => {
  const [summary, setSummary] = useState('');
  const labelCls = { fontWeight: '600', color: '#111827', marginBottom: 6, fontSize: 14 } as const;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <SubHeader title="Report a bug" right={<Text style={{ color: '#9ca3af', fontWeight: '500', fontSize: 14 }}>Send</Text>} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 32, gap: 20 }}>
        <View>
          <Text style={labelCls}>Select bug location</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>Select bug location</Text>
            <ChevronDown />
          </View>
        </View>
        <View>
          <Text style={labelCls}>Bug summary</Text>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Please be as detailed as possible. What did you expect and what happened instead?"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ width: '100%', minHeight: 100, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, color: '#374151', fontSize: 14 }}
          />
        </View>
        <View>
          <Text style={[labelCls, { marginBottom: 8 }]}>Bug related media upload</Text>
          <Pressable style={{ width: 80, height: 80, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
