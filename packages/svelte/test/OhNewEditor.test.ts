import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import OhNewEditor from '../src/OhNewEditor.svelte';

describe('OhNewEditor (Svelte)', () => {
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
