import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/theme';
import { SvgProps } from 'react-native-svg';

import { BellIcon } from '@/svg-icons/tabs/BellIcon';
import { InboxIcon } from '@/svg-icons/tabs/InboxIcon';
import { CallsIconOutline } from '@/svg-icons/tabs/CallsIcon';
import { GearIcon } from '@/svg-icons/tabs/NavIcons';
import { TabParamList } from './AppTabs';

type NavIconProps = { focused: boolean; routeName: keyof TabParamList; color: string };

const ICON_SIZE = 22;

const TabBarIcon = ({ focused, routeName, color }: NavIconProps) => {
  const props = { width: ICON_SIZE, height: ICON_SIZE, color, stroke: color } as Partial<SvgProps>;
  let icon: React.ReactNode;
  switch (routeName) {
    case 'Notifications':
      icon = <BellIcon {...props} />;
      break;
    case 'Inbox':
      icon = <InboxIcon {...props} />;
      break;
    case 'Calls':
      icon = <CallsIconOutline width={ICON_SIZE} height={ICON_SIZE} />;
      break;
    case 'Settings':
      icon = <GearIcon {...props} />;
      break;
    default:
      return null;
  }
  return <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>{icon}</View>;
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { isDark, colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: isDark ? '#1B1C20' : '#F0F0F3',
        backgroundColor: isDark ? '#101113' : '#ffffff',
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

        const activeColor = isDark ? '#ffffff' : '#282E34';
        const inactiveColor = isDark ? '#80838D' : '#80838D';
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
                fontFamily: 'Gontserrat-Bold',
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

