// Stub for @chatwoot/utils
// Replace with the real package when available.

export const formatMessageContent = (content: string) => content || '';
export const getMessagePlaceHolder = () => 'Message...';

const VARIABLE_REGEX = /{{([^}]+)}}/g;

export const extractVariables = (text: string): string[] => {
  if (!text) return [];
  const matches = text.match(VARIABLE_REGEX) || [];
  return matches.map(match => match.slice(2, -2).trim());
};

export const getMessageVariables = ({
  conversation,
  contact,
}: {
  conversation?: any;
  contact?: any;
}): Record<string, string> => {
  const variables: Record<string, string> = {};
  if (contact) {
    variables.contact_name = contact.name || '';
    variables.contact_email = contact.email || '';
    variables.contact_phone = contact.phone_number || contact.phoneNumber || '';
    if (contact.custom_attributes) {
      Object.entries(contact.custom_attributes).forEach(([key, value]) => {
        variables[`contact.${key}`] = String(value ?? '');
      });
    }
  }
  if (conversation) {
    variables.conversation_id = String(conversation.id ?? '');
    if (conversation.status) variables.conversation_status = conversation.status;
    if (conversation.custom_attributes) {
      Object.entries(conversation.custom_attributes).forEach(([key, value]) => {
        variables[`conversation.${key}`] = String(value ?? '');
      });
    }
    const sender = conversation?.meta?.sender;
    if (sender && !variables.contact_name) {
      variables.contact_name = sender.name || '';
      variables.contact_email = sender.email || '';
      variables.contact_phone = sender.phone_number || sender.phoneNumber || '';
    }
  }
  return variables;
};

export const replaceVariablesInMessage = ({
  message,
  variables,
}: {
  message: string;
  variables: Record<string, string>;
}): string => {
  if (!message) return '';
  return message.replace(VARIABLE_REGEX, (_match, rawKey) => {
    const key = rawKey.trim();
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
};

export const getUndefinedVariablesInMessage = ({
  message,
  variables,
}: {
  message: string;
  variables: Record<string, string>;
}): string[] => {
  if (!message) return [];
  return extractVariables(message).filter(key => variables[key] === undefined);
};

type TypingIndicator = {
  start: () => void;
  stop: () => void;
};

export const createTypingIndicator = (
  onStart: () => void,
  onStop: () => void,
  idleTime: number,
): TypingIndicator => {
  let typing = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const stop = () => {
    clearTimer();
    if (typing) {
      typing = false;
      onStop();
    }
  };

  return {
    start: () => {
      clearTimer();
      if (!typing) {
        typing = true;
        onStart();
      }
      timer = setTimeout(stop, idleTime);
    },
    stop,
  };
};

// ---- SLA ----

const TWO_SECONDS = 2 * 1000;

const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const evaluateSLAStatus = ({
  appliedSla,
  chat,
}: {
  appliedSla?: any;
  chat?: any;
}): { type: string; threshold: string; icon: string; isSlaMissed: boolean } | null => {
  if (!appliedSla) return null;

  const now = Date.now();
  const secondsPerDay = 86400;

  const thresholdToSeconds = (threshold: number | undefined | null): number | null => {
    if (threshold === undefined || threshold === null || threshold <= 0) return null;
    // Chatwoot stores thresholds in hours
    return threshold * 3600;
  };

  const toEpochSeconds = (value: number | undefined | null): number | null => {
    if (!value) return null;
    // Values are Unix timestamps in seconds
    return value;
  };

  const isWaitingForFirstReply = (): boolean => {
    const firstReply = chat?.first_reply_created_at;
    if (firstReply) return false;
    return chat?.status === 'open' || chat?.status === 'pending';
  };

  const waitingSince = toEpochSeconds(chat?.waiting_since);

  const evaluate = (type: string, thresholdSeconds: number | null): { type: string; threshold: string; icon: string; isSlaMissed: boolean } | null => {
    if (!thresholdSeconds || waitingSince === null) return null;

    const isFirstReply = type === 'FRT';
    const isFirstReplyWaiting = isWaitingForFirstReply();
    if (isFirstReply !== isFirstReplyWaiting) return null;

    const elapsed = (now / 1000) - waitingSince;
    const remaining = thresholdSeconds - elapsed;
    if (remaining <= 0) {
      return {
        type,
        threshold: 'Missed',
        icon: '⏰',
        isSlaMissed: true,
      };
    }
    if (remaining <= TWO_SECONDS) return null;
    return {
      type,
      threshold: formatDuration(remaining),
      icon: '⏱️',
      isSlaMissed: false,
    };
  };

  const firstResponse = thresholdToSeconds(appliedSla.sla_first_response_time_threshold);
  const nextResponse = thresholdToSeconds(appliedSla.sla_next_response_time_threshold);
  const resolution = thresholdToSeconds(appliedSla.sla_resolution_time_threshold);

  const candidates = [
    evaluate('FRT', firstResponse),
    evaluate('NRT', nextResponse),
    evaluate('RT', resolution),
  ].filter((c): c is { type: string; threshold: string; icon: string; isSlaMissed: boolean } => c !== null);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const order = { FRT: 0, NRT: 1, RT: 2 };
    return (order[a.type as keyof typeof order] ?? 3) - (order[b.type as keyof typeof order] ?? 3);
  });

  return candidates[0];
};

// ---- WhatsApp / Twilio template helpers ----

export const MEDIA_FORMATS = ['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'];

export const findComponentByType = (
  template: any,
  type: string,
): { format?: string; text?: string; buttons?: any[] } | undefined => {
  const components = Array.isArray(template?.components) ? template.components : [];
  return components.find((component: any) => component.type === type);
};

export const isSendableTemplate = (template: any): boolean => {
  if (!template) return false;
  return template.status === 'approved' || template.status === 'active' || template.status === undefined;
};

export const renderTemplatePreview = (
  body: string,
  values: Record<string, string>,
): string => {
  if (!body) return '';
  return body.replace(VARIABLE_REGEX, (_match, rawKey) => {
    const key = rawKey.trim();
    return values[key] !== undefined ? String(values[key]) : '';
  });
};

export const extractFilenameFromUrl = (url: string): string => {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/');
    return decodeURIComponent(segments[segments.length - 1] || '');
  } catch {
    const segments = url.split('/');
    return decodeURIComponent(segments[segments.length - 1] || '');
  }
};

export const isTwilioMediaTemplate = (template: any): boolean => {
  if (!template) return false;
  const mediaType = template.media_type || template.mediaType;
  if (!mediaType) return false;
  return String(mediaType).toLowerCase() !== 'none';
};

export const getTwilioMediaVariableKey = (template: any): string | undefined => {
  if (!isTwilioMediaTemplate(template)) return undefined;
  const types = template?.types;
  if (types && Array.isArray(types)) {
    const mediaType = types.find((t: any) => t && String(t.type).toLowerCase() === 'media');
    if (mediaType?.source) return String(mediaType.source).trim();
  }
  return '1';
};

export const getTwilioMediaUrl = (template: any): string => {
  return template?.media_url || '';
};

// ---- Types ----

export type WhatsAppTemplateHeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';

export type WhatsAppTemplateButton = {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text?: string;
  url?: string;
};

export type WhatsAppTemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: WhatsAppTemplateHeaderFormat;
  text?: string;
  buttons?: WhatsAppTemplateButton[];
};

export type WhatsAppMessageTemplate = {
  name: string;
  language: string;
  category: string;
  namespace: string;
  status?: string;
  components?: WhatsAppTemplateComponent[];
};

export type TemplateButtonParam =
  | { type: 'url'; parameter: string; url?: string; variables?: string[] }
  | { type: 'copy_code'; parameter: string };

export type WhatsAppProcessedParams = {
  body?: Record<string, string>;
  header?: {
    media_url?: string;
    media_type?: string;
    media_name?: string;
  };
  buttons?: TemplateButtonParam[];
};

export type TwilioProcessedParams = Record<string, string>;

export type TwilioContentTemplate = {
  contentSid: string;
  friendlyName: string;
  language: string;
  category: string;
  status: string;
  templateType: string;
  mediaType: string;
  body: string;
  variables: string[];
  types: Array<{ type: string; source?: string }>;
};

export type SLAStatus = {
  type: string;
  threshold: string;
  icon: string;
  isSlaMissed: boolean;
};
