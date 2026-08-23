import React, { useState } from 'react';
import { Pressable, StatusBar, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

// ---------- Icons ----------
const ChevronRight = () => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const UserIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const WorkspaceIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M9 9h6M9 12h6M9 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

const BellIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LockIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const MoonIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PhoneIconSm = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <Path d="M9 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const AlertIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

const ChatIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const LogoutIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ---------- Toggle ----------
const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <Pressable onPress={onToggle} style={{ width: 48, height: 24, borderRadius: 999, backgroundColor: on ? '#3b82f6' : '#d1d5db', justifyContent: 'center', paddingHorizontal: 2 }}>
    <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: 'white', alignSelf: on ? 'flex-end' : 'flex-start' }} />
  </Pressable>
);

const iconBox = { width: 32, height: 32, alignItems: 'center' as const, justifyContent: 'center' as const, color: '#4b5563' as const };
const rowCls = { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' };

// ---------- Settings Screen (reference-exact from wapilot-design L1008-1153) ----------
const SettingsScreenDesign = () => {
  const [haptic, setHaptic] = useState(true);
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar translucent backgroundColor="white" barStyle={'dark-content'} />
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#111827' }}>Settings</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Profile */}
          <Pressable style={rowCls} onPress={() => navigation.navigate('ProfileScreen')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: '#14b8a6', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '700' }}>A</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: '#111827', flexShrink: 1 }}>Ahmed Adel</Text>
                <Text style={{ fontSize: 14, color: '#6b7280', flexShrink: 1 }}>dola02264@gmail.com</Text>
              </View>
            </View>
            <ChevronRight />
          </Pressable>

          {/* General */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 20, paddingBottom: 8 }}>General</Text>
            <View style={[rowCls, { paddingHorizontal: 0 }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={iconBox}>
                  <UserIcon />
                </View>
                <Text style={{ color: '#111827', flexShrink: 1 }}>Set yourself as <Text style={{ fontWeight: '700' }}>Busy</Text></Text>
              </View>
            </View>
          </View>

          {/* Account */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 20, paddingBottom: 8 }}>Account</Text>
            {[
              { icon: <WorkspaceIcon />, label: 'Change workspace', sub: 'My New Workspace', action: () => navigation.navigate('ChangeWorkspaceScreen') },
              { icon: <BellIcon />, label: 'Update notifications', sub: null, action: () => navigation.navigate('UpdateNotificationsScreen') },
              { icon: <LockIcon />, label: 'Change password', sub: null, action: () => navigation.navigate('ChangePasswordScreen') },
            ].map((item, i) => (
              <Pressable key={i} style={[rowCls, { paddingHorizontal: 0 }]} onPress={item.action}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={iconBox}>{item.icon}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#111827', flexShrink: 1 }}>{item.label}</Text>
                    {item.sub && <Text style={{ fontSize: 14, color: '#6b7280' }}>{item.sub}</Text>}
                  </View>
                </View>
                <ChevronRight />
              </Pressable>
            ))}
          </View>

          {/* App */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 20, paddingBottom: 8 }}>App</Text>
            <Pressable style={[rowCls, { paddingHorizontal: 0 }]} onPress={() => navigation.navigate('DarkModeScreen')}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={iconBox}>
                  <MoonIcon />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#111827' }}>Dark mode</Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>Off</Text>
                </View>
              </View>
              <ChevronRight />
            </Pressable>
            <View style={[rowCls, { paddingHorizontal: 0 }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={iconBox}>
                  <PhoneIconSm />
                </View>
                <Text style={{ color: '#111827' }}>Haptic feedback</Text>
              </View>
              <Toggle on={haptic} onToggle={() => setHaptic(!haptic)} />
            </View>
          </View>

          {/* Help & feedback */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingTop: 20, paddingBottom: 8 }}>Help & feedback</Text>
            {[
              { icon: <AlertIcon />, label: 'Report a bug', action: () => navigation.navigate('ReportBugScreen') },
              { icon: <ChatIcon />, label: 'Get support', action: () => setShowSupportSheet(true) },
            ].map((item, i) => (
              <Pressable key={i} style={[rowCls, { paddingHorizontal: 0 }]} onPress={item.action}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={iconBox}>{item.icon}</View>
                  <Text style={{ color: '#111827', flexShrink: 1, flex: 1 }}>{item.label}</Text>
                </View>
                <ChevronRight />
              </Pressable>
            ))}
          </View>

          {/* Log out */}
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Pressable style={[rowCls, { paddingHorizontal: 0 }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={iconBox}>
                  <LogoutIcon />
                </View>
                <Text style={{ color: '#111827', flex: 1 }}>Log out</Text>
              </View>
              <ChevronRight />
            </Pressable>
          </View>

          <Text style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 24 }}>Version 3.3.0 (1074) 2d0a4</Text>
        </ScrollView>

        {showSupportSheet && <GetSupportSheetLocal onClose={() => setShowSupportSheet(false)} />}
      </View>
    </SafeAreaView>
  );
};

// ---------- Get Support Sheet (reference-exact L967-1007) ----------
const GetSupportSheetLocal = ({ onClose }: { onClose: () => void }) => (
  <View style={{ position: 'absolute', inset: 0, zIndex: 50 }} onStartShouldSetResponder={() => true} onResponderRelease={onClose}>
    <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 40 }} onStartShouldSetResponder={() => true}>
      <View style={{ width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 999, alignSelf: 'center', marginTop: 12, marginBottom: 16 }} />
      <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center', marginBottom: 4 }}>Get Support</Text>
      <Text style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>Chat with us on WhatsApp</Text>
      <Pressable style={{ marginHorizontal: 24, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Open WhatsApp</Text>
      </Pressable>
    </View>
  </View>
);

export default SettingsScreenDesign;
