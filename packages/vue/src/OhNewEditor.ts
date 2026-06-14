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
    modelValue: {
      type: String,
      required: false
    },
    value: {
      type: String,
      required: false
    },
    options: {
      type: Object as () => EditorOptions | undefined,
      required: false
    }
  },
  emits: ['change', 'update:modelValue'],
  setup(props, { emit, expose }) {
    const host = ref<HTMLElement | null>(null);
    const editor = shallowRef<Editor | null>(null);
    const currentValue = ref<string | undefined>(props.modelValue ?? props.value);
    const isFocused = ref(false);

    const resolvedValue = () => props.modelValue ?? props.value;

    onMounted(() => {
      if (!host.value) return;

      const instance = createEditor(host.value, {
        ...props.options,
        initialContent: resolvedValue() ?? props.options?.initialContent
      });

      instance.on('change', () => {
        const nextValue = instance.getContent(props.options?.outputFormat ?? 'html');
        currentValue.value = nextValue;
        emit('change', nextValue);
        emit('update:modelValue', nextValue);
      });

      instance.on('focus', () => {
        isFocused.value = true;
      });

      instance.on('blur', () => {
        isFocused.value = false;
      });

      editor.value = instance;
    });

    onBeforeUnmount(() => {
      editor.value?.destroy();
      editor.value = null;
    });

    watch(
      () => resolvedValue(),
      (value) => {
        if (!editor.value || value === undefined || value === currentValue.value) return;
        if (isFocused.value) return;
        editor.value.setContent(value, props.options?.outputFormat ?? 'html');
        currentValue.value = value;
      }
    );

    watch(
      () => props.options?.readOnly,
      (readOnly) => {
        if (readOnly !== undefined) {
          editor.value?.setReadOnly(readOnly);
        }
      }
    );

    watch(
      () => props.options?.outputFormat,
      (outputFormat) => {
        if (outputFormat) {
          editor.value?.setOutputFormat(outputFormat);
        }
      }
    );

    expose({ editor });

    return () => h('div', { ref: host });
  }
});
