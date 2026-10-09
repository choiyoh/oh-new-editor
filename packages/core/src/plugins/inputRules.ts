import type { MarkType, Schema } from 'prosemirror-model';
import { InputRule, inputRules, textblockTypeInputRule, wrappingInputRule } from 'prosemirror-inputrules';

import { isSafeHref } from '../utils/url';
import { editorSchema } from '../schema';

function markInputRule(regexp: RegExp, markType: MarkType): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const [, content] = match;
    if (!content) return null;
    const mark = markType.create();
    const { tr } = state;
    tr.replaceWith(start, end, state.schema.text(content, [mark]));
    return tr;
  });
}

export function createInputRulesPlugin(schema: Schema = editorSchema) {
  const { nodes, marks } = schema;
  const rules: InputRule[] = [];

  // Inline formatting shortcuts. The single-asterisk rule must not match the
  // tail of `**text*`, otherwise `**bold**` turns into italic before the
  // closing pair is complete.
  if (marks.strong) rules.push(markInputRule(/\*\*([^*]+)\*\*$/, marks.strong));
  if (marks.em) rules.push(markInputRule(/(?<![*\w])\*([^*\s][^*]*)\*$/, marks.em));
  if (marks.strike) rules.push(markInputRule(/~~([^~]+)~~$/, marks.strike));
  if (marks.code) rules.push(markInputRule(/`([^`]+)`$/, marks.code));

  if (marks.link) {
    rules.push(
      new InputRule(/\[([^\]]+)\]\((\S+)\)$/, (state, match, start, end) => {
        const [, text, href] = match;
        if (!text || !href || !isSafeHref(href)) return null;
        const { tr } = state;
        tr.replaceWith(start, end, state.schema.text(text, [marks.link.create({ href })]));
        return tr;
      })
    );
  }

  if (nodes.heading) {
    rules.push(textblockTypeInputRule(/^(#{1,6})\s$/, nodes.heading, (match) => ({ level: match[1].length })));
  }
  if (nodes.blockquote) rules.push(wrappingInputRule(/^>\s$/, nodes.blockquote));
  if (nodes.bullet_list) rules.push(wrappingInputRule(/^[-*]\s$/, nodes.bullet_list));
  if (nodes.ordered_list) {
    rules.push(
      wrappingInputRule(
        /^(\d+)\.\s$/,
        nodes.ordered_list,
        (match) => ({ order: Number.parseInt(match[1] ?? '1', 10) }),
        (match, node) => node.childCount + node.attrs.order === Number(match[1])
      )
    );
  }
  if (nodes.horizontal_rule) {
    const hr = nodes.horizontal_rule;
    rules.push(
      new InputRule(/^(?:---|___|\*\*\*)$/, (state, _match, start, end) => {
        const transaction = state.tr.delete(start, end);
        transaction.replaceSelectionWith(hr.create());
        return transaction;
      })
    );
  }
  if (nodes.code_block) {
    rules.push(textblockTypeInputRule(/^```$/, nodes.code_block, () => ({ language: null })));
  }

  return inputRules({ rules });
}
