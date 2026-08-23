import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';

import {
  BellIcon,
  InboxIcon,
  PhoneIcon,
  GearIcon,
} from '@/svg-icons/tabs/NavIcons';
import { TabParamList } from './AppTabs';

type NavIconProps = { focused: boolean; routeName: keyof TabParamList; color: string };

const TabBarIcon = ({ focused, routeName, color }: NavIconProps) => {
  switch (routeName) {
    case 'Notifications':
      return <BellIcon filled={focused} color={color} />;
    case 'Inbox':
      return <InboxIcon filled={focused} color={color} />;
    case 'Calls':
      return <PhoneIcon filled={focused} color={color} />;
    case 'Settings':
      return <GearIcon filled={focused} color={color} />;
  }
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { isDark, colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#1e293b' : '#f3f4f6',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
      }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const activeColor = isDark ? '#ffffff' : '#111827';
        const inactiveColor = isDark ? '#64748b' : '#9ca3af';
        const itemColor = isFocused ? activeColor : inactiveColor;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            style={{
              flex: 1,
              flexDirection: 'column',
              alignItems: 'center',
              paddingVertical: 10,
            }}>
            <TabBarIcon focused={isFocused} routeName={route.name as keyof TabParamList} color={itemColor} />
            <Text
              style={{
                fontSize: 10,
                fontFamily: 'Inter-500-24',
                marginTop: 4,
                color: itemColor,
                fontWeight: isFocused ? '600' : '400',
              }}>
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

