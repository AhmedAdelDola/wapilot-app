import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tailwind } from '@/theme';
import { FilterChips, EmptyState, FAB } from '@/views/components';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Closed' },
  { id: 'snoozed', label: 'Snoozed' },
];

const EmptyInboxIcon = () => (
  <View style={tailwind.style('w-16 h-16 items-center justify-center')}>
    <Text style={tailwind.style('text-4xl')}>💬</Text>
  </View>
);

export const InboxScreenExample = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  return (
    <SafeAreaView style={tailwind.style('flex-1 bg-white')}>
      <View style={tailwind.style('px-5 pt-4 pb-2')}>
        <Text style={tailwind.style('text-[28px] font-inter-580-24 text-gray-950')}>
          Inbox
        </Text>
      </View>
      <FilterChips
        options={FILTER_OPTIONS}
        selectedId={selectedFilter}
        onSelect={setSelectedFilter}
      />
      <EmptyState
        icon={<EmptyInboxIcon />}
        title="No conversations to show"
        subtitle="Set up calls in Channel settings in Web"
      />
      <FAB
        label="Unreplied"
        onPress={() => console.log('FAB pressed')}
      />
    </SafeAreaView>
  );
};
