import React, { useRef, useState } from 'react';
import { Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerLayout } from 'react-native-gesture-handler';

import { tailwind } from '@/theme';
import { useTheme } from '@/theme';
import { FilterChips, EmptyState, Sidebar, FAB } from '@/views/components';
import { EmptyCallsIcon } from '@/svg-icons';

const CALL_STATUS_FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'missed', label: 'Missed' },
  { id: 'no_answer', label: 'No Answer' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'ended', label: 'Ended' },
];

const CallsScreen = () => {
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedInbox, setSelectedInbox] = useState('all');
  const drawerRef = useRef<DrawerLayout>(null);
  const { isDark } = useTheme();

  const handleInboxSelect = (id: string) => {
    setSelectedInbox(id);
    drawerRef.current?.closeDrawer();
  };

  const sidebarSections = [
    {
      id: 'main',
      title: '',
      icon: <View />,
      items: [
        { id: 'all', label: 'All', icon: <View style={tailwind.style('w-5 h-5 rounded-full bg-gray-200')} />, count: 0 },
        { id: 'mine', label: 'Mine', icon: <View style={tailwind.style('w-5 h-5 rounded-full bg-blue-200')} />, count: 0 },
        { id: 'unassigned', label: 'Unassigned', icon: <View style={tailwind.style('w-5 h-5 rounded-full bg-gray-300')} />, count: 0 },
      ],
    },
    {
      id: 'lifecycle',
      title: 'Lifecycle',
      icon: <View style={tailwind.style('w-5 h-5 rounded-full bg-green-200')} />,
      items: [
        { id: 'new-lead', label: 'New Lead', icon: <Text>+</Text>, count: 0 },
        { id: 'hot-lead', label: 'Hot Lead', icon: <Text>+</Text>, count: 0 },
        { id: 'payment', label: 'Payment', icon: <Text>+</Text>, count: 0 },
        { id: 'customer', label: 'Customer', icon: <Text>+</Text>, count: 0 },
      ],
    },
    {
      id: 'teams',
      title: 'Teams',
      icon: <View style={tailwind.style('w-5 h-5 rounded-full bg-purple-200')} />,
      items: [],
    },
    {
      id: 'customers',
      title: 'Customers',
      icon: <View style={tailwind.style('w-5 h-5 rounded-full bg-orange-200')} />,
      items: [],
    },
  ];

  const getSelectedInboxTitle = () => {
    const allItems = sidebarSections.flatMap(s => s.items);
    const selected = allItems.find(i => i.id === selectedInbox);
    return selected?.label || 'All';
  };

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={300}
        drawerPosition="left"
        drawerType="front"
        renderNavigationView={() => (
          <Sidebar
            sections={sidebarSections}
            selectedId={selectedInbox}
            onSelect={handleInboxSelect}
            isDark={isDark}
          />
        )}>
        <View style={tailwind.style('flex-1')}>
          <View style={tailwind.style('flex-row items-center justify-between px-4 py-3')}>
            <Pressable
              onPress={() => drawerRef.current?.openDrawer()}
              hitSlop={16}>
              <View style={tailwind.style('w-6 h-6 items-center justify-center')}>
                <Text style={tailwind.style('text-xl')}>{'\u2630'}</Text>
              </View>
            </Pressable>
            <Text style={tailwind.style('text-[20px] font-inter-580-24 text-gray-950')}>
              {getSelectedInboxTitle()}
            </Text>
            <View style={tailwind.style('w-6')} />
          </View>

          <FilterChips
            options={CALL_STATUS_FILTER_OPTIONS}
            selectedId={selectedStatus}
            onSelect={setSelectedStatus}
          />

          <View style={tailwind.style('flex-1 items-center justify-center px-8')}>
            <EmptyState
              icon={<EmptyCallsIcon size={64} color="#9CA3AF" />}
              title="No calls"
              subtitle="Set up calls in Channel settings in Web"
            />
          </View>
        </View>
      </DrawerLayout>
    </SafeAreaView>
  );
};

export default CallsScreen;
