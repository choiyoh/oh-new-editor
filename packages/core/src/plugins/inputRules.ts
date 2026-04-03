import { Fragment } from 'prosemirror-model';
import { InputRule, inputRules, textblockTypeInputRule, wrappingInputRule } from 'prosemirror-inputrules';

import { editorSchema } from '../schema';

const { nodes } = editorSchema;

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
