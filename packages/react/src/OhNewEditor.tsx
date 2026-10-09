import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';

import { createEditor, type Editor, type EditorOptions } from '@oh-new-editor/core';

export interface OhNewEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Called once the editor instance exists (after mount). */
  onReady?: (editor: Editor) => void;
  /**
   * Editor configuration. Structural options (toolbar, table, markdown, image,
   * placeholder, plugins, schema, ...) are read on mount only; give the
   * component a new `key` to rebuild it. `readOnly` and `outputFormat` are
   * applied live.
   */
  options?: EditorOptions;
  className?: string;
}

export const OhNewEditor = forwardRef<Editor | null, OhNewEditorProps>(function OhNewEditor(
  { value, onChange, onReady, options, className }: OhNewEditorProps,
  ref
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const currentValueRef = useRef<string | undefined>(value);
  const pendingValueRef = useRef<string | undefined>(undefined);
  const isFocusedRef = useRef(false);

  // Latest props for the long-lived editor event handlers.
  const latest = useRef({ onChange, onReady, outputFormat: options?.outputFormat });
  latest.current = { onChange, onReady, outputFormat: options?.outputFormat };

  useImperativeHandle<Editor | null, Editor | null>(ref, () => editor, [editor]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const instance = createEditor(host, {
      ...options,
      initialContent: value ?? options?.initialContent
    });
    currentValueRef.current = value;

    const format = () => latest.current.outputFormat ?? 'html';

    instance.on('change', () => {
      const nextValue = instance.getContent(format());
      currentValueRef.current = nextValue;
      latest.current.onChange?.(nextValue);
    });

    instance.on('focus', () => {
      isFocusedRef.current = true;
    });

    instance.on('blur', () => {
      isFocusedRef.current = false;
      // Apply a `value` that arrived while the user was typing.
      const pending = pendingValueRef.current;
      pendingValueRef.current = undefined;
      if (pending !== undefined && pending !== currentValueRef.current) {
        instance.setContent(pending, format());
        currentValueRef.current = pending;
      }
    });

    setEditor(instance);
    latest.current.onReady?.(instance);

    return () => {
      instance.destroy();
      setEditor(null);
    };
    // Structural options are intentionally mount-only (see prop docs).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!editor || options?.readOnly === undefined) return;
    editor.setReadOnly(options.readOnly);
  }, [editor, options?.readOnly]);

  useEffect(() => {
    if (!editor || !options?.outputFormat) return;
    editor.setOutputFormat(options.outputFormat);
  }, [editor, options?.outputFormat]);

  useEffect(() => {
    if (!editor || value === undefined || value === currentValueRef.current) return;
    if (isFocusedRef.current) {
      // Replacing content under the caret would jump the cursor; defer to blur.
      pendingValueRef.current = value;
      return;
    }
    editor.setContent(value, options?.outputFormat ?? 'html');
    currentValueRef.current = value;
  }, [editor, value, options?.outputFormat]);

  return <div ref={hostRef} className={className} />;
});
