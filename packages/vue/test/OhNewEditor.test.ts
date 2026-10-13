import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { OhNewEditor } from '../src/OhNewEditor';

// Destroy every editor before jsdom is torn down, including pending focus checks.
enableAutoUnmount(afterEach);

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
  it.each([
    ['<p>one</p>', 'one'],
    [undefined, 'one'],
    ['<p>three</p>', 'three'],
  ])('uses the latest value %s when a deferred update is superseded', async (latestValue, expected) => {
    const wrapper = mount(OhNewEditor, { props: { modelValue: '<p>one</p>' } });
    const dom = wrapper.find('.ProseMirror').element as HTMLElement;

    dom.dispatchEvent(new FocusEvent('focus'));
    await wrapper.setProps({ modelValue: '<p>two</p>' });
    await wrapper.setProps({ modelValue: latestValue });
    expect(dom.textContent).toBe('one');

    dom.dispatchEvent(new FocusEvent('blur'));
    expect(dom.textContent).toBe(expected);
    wrapper.unmount();
  });

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
