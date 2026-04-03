import { Schema } from 'prosemirror-model';

import { marks } from './marks';
import { nodes } from './nodes';

export const editorSchema: Schema<any, any> = new Schema({
  nodes,
  marks
});
