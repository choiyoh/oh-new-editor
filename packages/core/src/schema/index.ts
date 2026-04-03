import { Schema } from 'prosemirror-model';

import { marks } from './marks';
import { nodes } from './nodes';

export function createEditorSchema(customNodes: any = nodes): Schema<any, any> {
  return new Schema({
    nodes: customNodes,
    marks
  });
}

export const editorSchema: Schema<any, any> = createEditorSchema();
