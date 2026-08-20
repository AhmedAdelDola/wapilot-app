import React from 'react';
import { ScrollView, View } from 'react-native';
import { tailwind } from '@/theme';
import { FilterChip } from './FilterChip';

type FilterOption = {
  id: string;
  label: string;
};

type FilterChipsProps = {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export const FilterChips = ({ options, selectedId, onSelect }: FilterChipsProps) => {
  return (
    <View style={tailwind.style('px-5 py-3')}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tailwind.style('gap-2')}>
        {options.map(option => (
          <FilterChip
            key={option.id}
            label={option.label}
            isActive={option.id === selectedId}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
};
