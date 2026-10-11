import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { OhNewEditor } from '../src/OhNewEditor';

describe('OhNewEditor (Vue)', () => {
  it('renders the editor container', () => {
    const wrapper = mount(OhNewEditor, {
      props: { value: '<p>Hello</p>' }
    });

    expect(wrapper.find('.oh-editor').exists()).toBe(true);
    expect(wrapper.find('.oh-editor__content').exists()).toBe(true);
    expect(wrapper.find('.ProseMirror').exists()).toBe(true);
  });

  it('renders editor content', () => {
    const wrapper = mount(OhNewEditor, {
      props: { value: '<p>Hello Vue</p>' }
    });

    const proseMirror = wrapper.find('.ProseMirror');
    expect(proseMirror.text()).toContain('Hello Vue');
  });
});

describe('OhNewEditor (Vue) value sync', () => {
  it('defers a value received while focused until blur', async () => {
    const wrapper = mount(OhNewEditor, { props: { modelValue: '<p>one</p>' } });
    const dom = wrapper.find('.ProseMirror').element as HTMLElement;

    dom.dispatchEvent(new FocusEvent('focus'));
    await wrapper.setProps({ modelValue: '<p>two</p>' });
    expect(wrapper.find('.ProseMirror').text()).toBe('one');

    dom.dispatchEvent(new FocusEvent('blur'));
    expect(wrapper.find('.ProseMirror').text()).toBe('two');
  });
});
