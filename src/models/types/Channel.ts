export type ChannelType = 'web' | 'api' | 'telegram' | 'facebook' | 'whatsapp' | 'line' | 'email' | 'sms' | 'twilio';

export interface Channel {
  id: number;
  name: string;
  channel_type: ChannelType;
  account_id: number;
}

export type AssigneeOptions = Record<string, string>;
export type SortOptions = Record<string, string>;
export type StatusOptions = Record<string, string>;
