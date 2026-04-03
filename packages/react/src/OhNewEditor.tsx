import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react';

import { createEditor, type Editor, type EditorOptions } from '@oh-new-editor/core';

export interface OhNewEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  options?: EditorOptions;
}

export const OhNewEditor = forwardRef<Editor, OhNewEditorProps>(function OhNewEditor(
  { value, onChange, options }: OhNewEditorProps,
  ref
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const currentValueRef = useRef<string | undefined>(value);

  useImperativeHandle(ref, () => editorRef.current as Editor, []);

  useEffect(() => {
    if (!hostRef.current) return;

    const initialContent = value ?? options?.initialContent;
    const editor = createEditor(hostRef.current, {
      ...options,
      initialContent
    });

    editor.on('change', () => {
      const nextValue = editor.getContent(options?.outputFormat ?? 'html');
      currentValueRef.current = nextValue;
      onChange?.(nextValue);
    });

    editorRef.current = editor;

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === undefined || value === currentValueRef.current) return;
    editor.setContent(value, options?.outputFormat ?? 'html');
    currentValueRef.current = value;
  }, [value, options?.outputFormat]);

  return <div ref={hostRef} />;
});
