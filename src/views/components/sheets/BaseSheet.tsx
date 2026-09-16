import React from 'react';
import { View } from 'react-native';

type BaseSheetProps = {
  children: React.ReactNode;
  onClose: () => void;
  isDark?: boolean;
  bottomOffset?: number;
};

export const BaseSheet = ({
  children,
  onClose,
  isDark = false,
  bottomOffset = 0,
}: BaseSheetProps) => {
  return (
    <View
      style={{ position: 'absolute', inset: 0, zIndex: 50 }}
      onStartShouldSetResponder={() => true}
      onResponderRelease={onClose}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <View
        style={{
          position: 'absolute',
          bottom: bottomOffset,
          left: 0,
          right: 0,
          backgroundColor: isDark ? '#1B1C20' : 'white',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingBottom: 32,
        }}
        onStartShouldSetResponder={() => true}>
        <View
          style={{
            width: 40,
            height: 4,
            backgroundColor: isDark ? '#31343A' : '#EAEAEA',
            borderRadius: 999,
            alignSelf: 'center',
            marginTop: 12,
            marginBottom: 8,
          }}
        />
        {children}
      </View>
    </View>
  );
};
