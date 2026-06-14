import type { MarkType } from 'prosemirror-model';
import { Fragment } from 'prosemirror-model';
import { InputRule, inputRules, textblockTypeInputRule, wrappingInputRule } from 'prosemirror-inputrules';

import { editorSchema } from '../schema';

const { nodes } = editorSchema;

function markInputRule(regexp: RegExp, markType: MarkType): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const [fullMatch, content] = match;
    if (!content) return null;
    const mark = markType.create();
    const { tr } = state;
    tr.replaceWith(start, end, state.schema.text(content, [mark]));
    return tr;
  });
}

function horizontalRuleInputRule() {
  return new InputRule(/^(?:---|___|\*\*\*)$/, (state, _match, start, end) => {
    const transaction = state.tr.delete(start, end);
    transaction.replaceSelectionWith(nodes.horizontal_rule.create());
    return transaction;
  });
}

function codeBlockInputRule() {
  return textblockTypeInputRule(/^```$/, nodes.code_block, () => ({ language: null }));
}

export function createInputRulesPlugin() {
  return inputRules({
    rules: [
      // Inline formatting shortcuts
      markInputRule(/(?:\*\*)([^*]+)(?:\*\*)$/, editorSchema.marks.strong),
      markInputRule(/(?:\*)([^*]+)(?:\*)$/, editorSchema.marks.em),
      markInputRule(/(?:~~)([^~]+)(?:~~)$/, editorSchema.marks.strike),
      markInputRule(/(?:`)([^`]+)(?:`)$/, editorSchema.marks.code),
      new InputRule(/\[([^\]]+)\]\((\S+)\)$/, (state, match, start, end) => {
        const [fullMatch, text, href] = match;
        if (!text || !href) return null;
        const mark = editorSchema.marks.link.create({ href });
        const { tr } = state;
        tr.replaceWith(start, end, editorSchema.text(text, [mark]));
        return tr;
      }),

      textblockTypeInputRule(/^(#{1})\s$/, nodes.heading, () => ({ level: 1 })),
      textblockTypeInputRule(/^(#{2})\s$/, nodes.heading, () => ({ level: 2 })),
      textblockTypeInputRule(/^(#{3})\s$/, nodes.heading, () => ({ level: 3 })),
      textblockTypeInputRule(/^(#{4})\s$/, nodes.heading, () => ({ level: 4 })),
      textblockTypeInputRule(/^(#{5})\s$/, nodes.heading, () => ({ level: 5 })),
      textblockTypeInputRule(/^(#{6})\s$/, nodes.heading, () => ({ level: 6 })),
      wrappingInputRule(/^>\s$/, nodes.blockquote),
      wrappingInputRule(/^[-*]\s$/, nodes.bullet_list),
      wrappingInputRule(/^(\d+)\.\s$/, nodes.ordered_list, (match) => ({ start: Number.parseInt(match[1] ?? '1', 10) })),
      horizontalRuleInputRule(),
      codeBlockInputRule()
    ]
  });
}
