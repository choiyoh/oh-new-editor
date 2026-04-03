import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from 'vue';

import { createEditor, type Editor, type EditorOptions } from '@oh-new-editor/core';

export const OhNewEditor = defineComponent({
  name: 'OhNewEditor',
  props: {
    value: {
      type: String,
      required: false
    },
    options: {
      type: Object as () => EditorOptions | undefined,
      required: false
    }
  },
  emits: ['change'],
  setup(props, { emit, expose }) {
    const host = ref<HTMLElement | null>(null);
    const editor = shallowRef<Editor | null>(null);
    const currentValue = ref<string | undefined>(props.value);

    onMounted(() => {
      if (!host.value) return;

      const instance = createEditor(host.value, {
        ...props.options,
        initialContent: props.value ?? props.options?.initialContent
      });

      instance.on('change', () => {
        const nextValue = instance.getContent(props.options?.outputFormat ?? 'html');
        currentValue.value = nextValue;
        emit('change', nextValue);
      });

      editor.value = instance;
    });

    onBeforeUnmount(() => {
      editor.value?.destroy();
      editor.value = null;
    });

    watch(
      () => props.value,
      (value) => {
        if (!editor.value || value === undefined || value === currentValue.value) return;
        editor.value.setContent(value, props.options?.outputFormat ?? 'html');
        currentValue.value = value;
      }
    );

    expose({ editor });

    return () => h('div', { ref: host });
  }
});
