import { Plugin, PluginKey } from 'prosemirror-state';

export interface AIStreamState {
  active: boolean;
  startPos: number;
  currentPos: number;
}

export const aiPluginKey = new PluginKey<AIStreamState>('ai-stream');

export function createAIPlugin() {
  return new Plugin<AIStreamState>({
    key: aiPluginKey,
    state: {
      init() {
        return { active: false, startPos: 0, currentPos: 0 };
      },
      apply(tr, state) {
        const meta = tr.getMeta(aiPluginKey);
        if (meta) {
          return { ...state, ...meta };
        }
        return state;
      }
    }
  });
}
