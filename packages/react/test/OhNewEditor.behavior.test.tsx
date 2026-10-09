import { act, render } from '@testing-library/react';
import { createRef, StrictMode, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { Editor } from '@oh-new-editor/core';
import { OhNewEditor } from '../src/OhNewEditor';


describe('OhNewEditor behaviour', () => {
  it('exposes the editor instance through the forwarded ref', () => {
    const ref = createRef<Editor | null>();
    render(
      <StrictMode>
        <OhNewEditor ref={ref} value="<p>Hi</p>" />
      </StrictMode>
    );
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getContent('html')).toBe('<p>Hi</p>');
  });

  it('calls the latest onChange callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const ref = createRef<Editor | null>();
    const { rerender } = render(<OhNewEditor ref={ref} onChange={first} />);
    rerender(<OhNewEditor ref={ref} onChange={second} />);

    act(() => ref.current!.setContent('<p>changed</p>'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('<p>changed</p>');
  });

  it('applies a value that arrived while focused once the editor blurs', () => {
    const ref = createRef<Editor | null>();
    let setValue!: (value: string) => void;
    function Harness() {
      const [value, set] = useState('<p>one</p>');
      setValue = set;
      return <OhNewEditor ref={ref} value={value} />;
    }
    const { container } = render(<Harness />);
    const dom = container.querySelector('.ProseMirror') as HTMLElement;

    act(() => dom.dispatchEvent(new FocusEvent('focus')));
    act(() => setValue('<p>two</p>'));
    expect(ref.current!.getContent('html')).toBe('<p>one</p>');

    act(() => dom.dispatchEvent(new FocusEvent('blur')));
    expect(ref.current!.getContent('html')).toBe('<p>two</p>');
  });
});
