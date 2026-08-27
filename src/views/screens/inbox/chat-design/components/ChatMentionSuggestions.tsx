import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Agent } from '@/models/types';

type ChatMentionSuggestionsProps = {
  agents: Agent[];
  query: string;
  isDark: boolean;
  onSelect: (agent: Agent) => void;
};

export const ChatMentionSuggestions = ({
  agents,
  query,
  isDark,
  onSelect,
}: ChatMentionSuggestionsProps) => {
  const filtered = agents.filter(agent => {
    const name = (agent.name || agent.availableName || '').toLowerCase();
    return name.includes(query.toLowerCase());
  });

  if (filtered.length === 0) return null;

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      style={{
        maxHeight: 160,
        marginTop: 6,
        borderWidth: 1,
        borderColor: isDark ? '#334155' : '#d1d5db',
        borderRadius: 10,
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
      }}>
      {filtered.slice(0, 6).map(agent => (
        <Pressable
          key={agent.id}
          onPress={() => onSelect(agent)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#334155' : '#f3f4f6',
          }}>
          <Text style={{ color: isDark ? '#f8fafc' : '#111827', fontSize: 14, fontWeight: '500' }}>
            @{agent.name || agent.availableName}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export const extractMentionQuery = (text: string): string | null => {
  const match = text.match(/(?:^|\s)@(\w*)$/);
  return match ? match[1] : null;
};

export const insertMention = (text: string, agent: Agent): string => {
  const name = agent.name || agent.availableName || 'User';
  const mention = `@[${name}](${agent.id}) `;
  return text.replace(/(?:^|\s)@\w*$/, prefix => `${prefix.trimEnd()} ${mention}`.trimStart());
};
