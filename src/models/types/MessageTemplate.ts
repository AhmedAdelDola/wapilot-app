import type {
  TemplateButtonParam,
  TwilioContentTemplate,
  TwilioProcessedParams,
  WhatsAppMessageTemplate,
  WhatsAppProcessedParams,
} from '@chatwoot/utils';

export interface MessageTemplate {
  id: number;
  name: string;
  content?: string;
}

export type {
  TemplateButtonParam,
  TwilioContentTemplate,
  TwilioProcessedParams,
  WhatsAppMessageTemplate,
  WhatsAppProcessedParams,
};

export type NormalizedTemplateHeader = {
  format: string;
  text?: string;
};

export type NormalizedTemplateButton = {
  index: number;
  type: 'url' | 'copy_code';
  url?: string;
  variables?: string[];
};

export type NormalizedTemplate = {
  id: string;
  name: string;
  platform: 'whatsapp' | 'twilio';
  language: string;
  category: string;
  namespace?: string;
  body: string;
  variables: string[];
  header?: NormalizedTemplateHeader;
  actions?: string[];
  buttons?: NormalizedTemplateButton[];
  isMediaTemplate?: boolean;
  mediaVariableKey?: string;
  templateMediaUrl?: string;
};

export type PreviewSegment = {
  text: string;
  filled: boolean;
};

export type TemplateFormState = {
  bodyValues: Record<string, string>;
  mediaUrl: string;
  mediaName: string;
  buttonValues: Record<number, string>;
};

export type TemplateSendParams = {
  name: string;
  language: string;
  category?: string;
  namespace?: string;
  processed_params: WhatsAppProcessedParams | TwilioProcessedParams;
};