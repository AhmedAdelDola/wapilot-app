import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { tailwind } from '@/theme';
import { SidebarItem } from './SidebarItem';
import { SidebarSection } from './SidebarSection';

type SidebarSectionData = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: {
    id: string;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[];
};

type SidebarProps = {
  sections: SidebarSectionData[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export const Sidebar = ({ sections, selectedId, onSelect }: SidebarProps) => {
  return (
    <ScrollView style={tailwind.style('flex-1 bg-white')}>
      <View style={tailwind.style('pt-4 pb-8')}>
        <Text style={tailwind.style('text-[28px] font-inter-580-24 text-gray-950 px-4 mb-4')}>
          Inbox
        </Text>
        {sections.map(section => (
          <SidebarSection
            key={section.id}
            title={section.title}
            icon={section.icon}>
            {section.items.length > 0 ? (
              section.items.map(item => (
                <SidebarItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  count={item.count}
                  isActive={item.id === selectedId}
                  onPress={() => onSelect(item.id)}
                />
              ))
            ) : (
              <View style={tailwind.style('px-4 py-3 mx-3')}>
                <Text style={tailwind.style('text-[14px] font-inter-normal-20 text-gray-400')}>
                  No inboxes available
                </Text>
              </View>
            )}
          </SidebarSection>
        ))}
      </View>
    </ScrollView>
  );
};
