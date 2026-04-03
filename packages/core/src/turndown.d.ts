declare module 'turndown' {
  export interface TurndownOptions {
    headingStyle?: 'setext' | 'atx';
    hr?: string;
    bulletListMarker?: '-' | '+' | '*';
    codeBlockStyle?: 'indented' | 'fenced';
    fence?: '```' | '~~~';
    emDelimiter?: '_' | '*';
    strongDelimiter?: '**' | '__';
    linkStyle?: 'inlined' | 'referenced';
    linkReferenceStyle?: 'full' | 'collapsed' | 'shortcut';
    preformattedCode?: boolean;
  }

  export interface TurndownRule {
    filter:
      | string
      | string[]
      | ((node: HTMLElement, options: TurndownOptions) => boolean);
    replacement: (content: string, node: HTMLElement, options: TurndownOptions) => string;
  }

  export default class TurndownService {
    constructor(options?: TurndownOptions);
    addRule(key: string, rule: TurndownRule): this;
    keep(filter: string | string[] | ((node: HTMLElement, options: TurndownOptions) => boolean)): this;
    remove(filter: string | string[] | ((node: HTMLElement, options: TurndownOptions) => boolean)): this;
    turndown(input: string | Node): string;
  }
}
