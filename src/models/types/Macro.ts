export interface Macro {
  id: number;
  name: string;
  description?: string;
  shortcode?: string;
  content?: string;
  hasChevron?: boolean;
  actions?: MacroAction[];
}

export interface MacroAction {
  actionName: string;
  actionParams?: string[];
}
