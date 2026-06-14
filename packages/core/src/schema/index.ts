import { Schema } from 'prosemirror-model';
import type { SchemaSpec } from 'prosemirror-model';

import { marks } from './marks';
import { nodes } from './nodes';

export function createEditorSchema(customNodes: SchemaSpec['nodes'] = nodes): Schema {
  return new Schema({
    nodes: customNodes,
    marks
  });
}

export const editorSchema: Schema = createEditorSchema();
