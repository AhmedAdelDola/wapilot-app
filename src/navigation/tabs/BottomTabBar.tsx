import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { tailwind } from '@/theme';

import {
  BellIcon,
  InboxIcon,
  PhoneIcon,
  GearIcon,
} from '@/svg-icons/tabs/NavIcons';
import { TabParamList } from './AppTabs';

type NavIconProps = { focused: boolean; routeName: keyof TabParamList };

const TabBarIcon = ({ focused, routeName }: NavIconProps) => {
  switch (routeName) {
    case 'Notifications':
      return <BellIcon filled={focused} />;
    case 'Inbox':
      return <InboxIcon filled={focused} />;
    case 'Calls':
      return <PhoneIcon filled={focused} />;
    case 'Settings':
      return <GearIcon filled={focused} />;
  }
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={tailwind.style('flex-row border-t border-gray-100 bg-white')}>
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

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            style={tailwind.style('flex-1 flex-col items-center py-2.5', isFocused ? 'text-gray-900' : 'text-gray-400')}>
            <TabBarIcon focused={isFocused} routeName={route.name as keyof TabParamList} />
            <Text
              style={tailwind.style(
                'text-[10px] font-inter-medium-24 mt-1',
                isFocused ? 'text-gray-900' : 'text-gray-400',
              )}>
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};
