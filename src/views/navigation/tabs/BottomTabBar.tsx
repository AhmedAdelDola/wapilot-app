import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useResponsive } from '@/utils';

import { BellIcon } from '@/svg-icons/tabs/BellIcon';
import { InboxIcon } from '@/svg-icons/tabs/InboxIcon';
import { CallsIconOutline } from '@/svg-icons/tabs/CallsIcon';
import { GearIcon } from '@/svg-icons/tabs/NavIcons';
import { TabParamList } from './AppTabs';
import i18n from '@/i18n';

type NavIconProps = { focused: boolean; routeName: keyof TabParamList; color: string };

const ICON_SIZE = 22;

const TabBarIcon = ({ focused, routeName, color }: NavIconProps) => {
  const iconProps = { width: ICON_SIZE, height: ICON_SIZE, color, stroke: color };
  let icon: React.ReactNode;
  switch (routeName) {
    case 'Notifications':
      icon = <BellIcon {...iconProps as any} />;
      break;
    case 'Inbox':
      icon = <InboxIcon {...iconProps as any} />;
      break;
    case 'Calls':
      icon = <CallsIconOutline width={ICON_SIZE} height={ICON_SIZE} />;
      break;
    case 'Settings':
      icon = <GearIcon {...iconProps as any} />;
      break;
    default:
      return null;
  }
  return <View style={{ width: ICON_SIZE, height: ICON_SIZE }}>{icon}</View>;
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.tabBorder || (isDark ? '#212121' : '#EAEAEA'),
        backgroundColor: colors.tabBg || (isDark ? '#0D0D0D' : '#FAFAFA'),
        alignItems: 'center',
      }}>
      <View
        style={{
          flexDirection: 'row',
          width: '100%',
          maxWidth: isTablet ? 600 : '100%',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
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

        const activeColor = colors.tabActive || '#4162E3';
        const inactiveColor = colors.tabInactive || '#80838D';
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
              paddingVertical: 4,
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
              {(() => {
                switch (route.name) {
                  case 'Notifications':
                    return i18n.t('FOOTER.NOTIFICATION');
                  case 'Inbox':
                    return i18n.t('FOOTER.CONVERSATION');
                  case 'Calls':
                    return i18n.t('FOOTER.CALLS');
                  case 'Settings':
                    return i18n.t('FOOTER.SETTINGS');
                  default:
                    return route.name;
                }
              })()}
            </Text>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
};

