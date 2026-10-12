import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import OhNewEditor from '../src/OhNewEditor.svelte';

describe('OhNewEditor (Svelte)', () => {
  it.each([
    ['<p>one</p>', 'one'],
    [undefined, 'one'],
    ['<p>three</p>', 'three'],
  ])('uses the latest value %s when a deferred update is superseded', async (latestValue, expected) => {
    const { container, rerender } = render(OhNewEditor, { props: { value: '<p>one</p>' } });
    const dom = container.querySelector('.ProseMirror') as HTMLElement;

    dom.dispatchEvent(new FocusEvent('focus'));
    await rerender({ value: '<p>two</p>' });
    await rerender({ value: latestValue });
    expect(dom.textContent).toBe('one');

    dom.dispatchEvent(new FocusEvent('blur'));
    expect(dom.textContent).toBe(expected);
  });

  it('renders the editor container', () => {
    const { container } = render(OhNewEditor, {
      props: { value: '<p>Hello</p>' }
    });

    expect(container.querySelector('.oh-editor')).toBeTruthy();
    expect(container.querySelector('.oh-editor__content')).toBeTruthy();
    expect(container.querySelector('.ProseMirror')).toBeTruthy();
  });

  it('renders editor content', () => {
    const { container } = render(OhNewEditor, {
      props: { value: '<p>Hello Svelte</p>' }
    });

    const proseMirror = container.querySelector('.ProseMirror');
    expect(proseMirror?.textContent).toContain('Hello Svelte');
  });
});
