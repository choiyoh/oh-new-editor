import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OhNewEditor } from '../src/OhNewEditor';

describe('OhNewEditor (React)', () => {
  it('renders the editor container', () => {
    const { container } = render(<OhNewEditor value="<p>Hello</p>" />);

    expect(container.querySelector('.oh-editor')).toBeTruthy();
    expect(container.querySelector('.oh-editor__content')).toBeTruthy();
    expect(container.querySelector('.ProseMirror')).toBeTruthy();
  });

  it('renders editor content', () => {
    const { container } = render(<OhNewEditor value="<p>Hello World</p>" />);

    const proseMirror = container.querySelector('.ProseMirror');
    expect(proseMirror?.textContent).toContain('Hello World');
  });
});
