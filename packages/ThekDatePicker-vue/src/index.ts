import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";
import { ThekDatePicker, setGlobalOptions } from "thekdatepicker";
import type { DateInput, ThekDatePickerOptions, ThekDatePickerThemeOption } from "thekdatepicker";

const pickerOptionKeys = [
  "format",
  "locale",
  "useLocaleDefaults",
  "enableTime",
  "timeFormat",
  "minDate",
  "maxDate",
  "defaultDate",
  "placeholder",
  "disabled",
  "appendTo",
  "weekStartsOn",
  "closeOnSelect",
  "showCalendarButton",
  "openOnInputClick",
  "zIndex",
  "theme",
  "reactiveTheme",
  "themeAttribute",
  "suspiciousWarning",
  "suspiciousYearSpan",
  "suspiciousMinYear",
  "suspiciousMaxYear",
  "suspiciousMessage",
  "revertWarning",
  "revertMessage",
] as const;

type PickerOptionKey = (typeof pickerOptionKeys)[number];

function assignOptionIfDefined<K extends keyof ThekDatePickerOptions>(
  options: ThekDatePickerOptions,
  key: K,
  value: ThekDatePickerOptions[K] | undefined,
): void {
  if (value !== undefined) {
    options[key] = value;
  }
}

export const ThekDatePickerVue = defineComponent({
  name: "ThekDatePicker",
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [Date, String, null] as PropType<DateInput | null | undefined>,
      default: null,
    },
    format: {
      type: String,
      default: undefined,
    },
    locale: {
      type: String,
      default: undefined,
    },
    useLocaleDefaults: {
      type: Boolean,
      default: undefined,
    },
    enableTime: {
      type: Boolean,
      default: undefined,
    },
    timeFormat: {
      type: String,
      default: undefined,
    },
    minDate: {
      type: [Date, String, null] as PropType<DateInput | null>,
      default: null,
    },
    maxDate: {
      type: [Date, String, null] as PropType<DateInput | null>,
      default: null,
    },
    defaultDate: {
      type: [Date, String, null] as PropType<DateInput | null>,
      default: null,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: undefined,
    },
    appendTo: {
      type: Object as PropType<HTMLElement | null>,
      default: undefined,
    },
    weekStartsOn: {
      type: Number as PropType<0 | 1 | 2 | 3 | 4 | 5 | 6>,
      default: undefined,
    },
    closeOnSelect: {
      type: Boolean,
      default: undefined,
    },
    showCalendarButton: {
      type: Boolean,
      default: undefined,
    },
    openOnInputClick: {
      type: Boolean,
      default: undefined,
    },
    zIndex: {
      type: Number,
      default: undefined,
    },
    theme: {
      type: [String, Object] as PropType<ThekDatePickerThemeOption>,
      default: undefined,
    },
    reactiveTheme: {
      type: Boolean,
      default: undefined,
    },
    themeAttribute: {
      type: String,
      default: undefined,
    },
    suspiciousWarning: {
      type: Boolean,
      default: undefined,
    },
    suspiciousYearSpan: {
      type: Number,
      default: undefined,
    },
    suspiciousMinYear: {
      type: Number,
      default: undefined,
    },
    suspiciousMaxYear: {
      type: Number,
      default: undefined,
    },
    suspiciousMessage: {
      type: String,
      default: undefined,
    },
    revertWarning: {
      type: Boolean,
      default: undefined,
    },
    revertMessage: {
      type: String,
      default: undefined,
    },
  },
  emits: ["update:modelValue", "change", "open", "close"],
  setup(props, { attrs, emit, expose }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    let picker: ThekDatePicker | null = null;

    const getOptions = (): ThekDatePickerOptions => {
      const options: ThekDatePickerOptions = {};

      assignOptionIfDefined(options, "format", props.format);
      assignOptionIfDefined(options, "locale", props.locale);
      assignOptionIfDefined(options, "useLocaleDefaults", props.useLocaleDefaults);
      assignOptionIfDefined(options, "enableTime", props.enableTime);
      assignOptionIfDefined(options, "timeFormat", props.timeFormat);
      if (props.minDate !== null) options.minDate = props.minDate;
      if (props.maxDate !== null) options.maxDate = props.maxDate;
      if (props.defaultDate !== null) options.defaultDate = props.defaultDate;
      assignOptionIfDefined(options, "placeholder", props.placeholder);
      assignOptionIfDefined(options, "disabled", props.disabled);
      if (props.appendTo !== undefined && props.appendTo !== null) {
        options.appendTo = props.appendTo;
      }
      assignOptionIfDefined(options, "weekStartsOn", props.weekStartsOn);
      assignOptionIfDefined(options, "closeOnSelect", props.closeOnSelect);
      assignOptionIfDefined(options, "showCalendarButton", props.showCalendarButton);
      assignOptionIfDefined(options, "openOnInputClick", props.openOnInputClick);
      assignOptionIfDefined(options, "zIndex", props.zIndex);
      assignOptionIfDefined(options, "theme", props.theme);
      assignOptionIfDefined(options, "reactiveTheme", props.reactiveTheme);
      assignOptionIfDefined(options, "themeAttribute", props.themeAttribute);
      assignOptionIfDefined(options, "suspiciousWarning", props.suspiciousWarning);
      assignOptionIfDefined(options, "suspiciousYearSpan", props.suspiciousYearSpan);
      assignOptionIfDefined(options, "suspiciousMinYear", props.suspiciousMinYear);
      assignOptionIfDefined(options, "suspiciousMaxYear", props.suspiciousMaxYear);
      assignOptionIfDefined(options, "suspiciousMessage", props.suspiciousMessage);
      assignOptionIfDefined(options, "revertWarning", props.revertWarning);
      assignOptionIfDefined(options, "revertMessage", props.revertMessage);
      options.onChange = (date, formatted, instance) => {
        emit("update:modelValue", date);
        emit("change", date, formatted, instance);
      };
      options.onOpen = (instance) => emit("open", instance);
      options.onClose = (instance) => emit("close", instance);

      return options;
    };

    const syncValueToPicker = (value: DateInput | null | undefined): void => {
      if (!picker) return;
      if (value === null || value === undefined) {
        picker.clear(false);
        return;
      }
      picker.setDate(value, false);
    };

    const destroyPicker = (): void => {
      picker?.destroy();
      picker = null;
    };

    const createPicker = (): void => {
      const input = inputRef.value;
      if (!input) {
        return;
      }

      picker = new ThekDatePicker(input, getOptions());
      syncValueToPicker(props.modelValue ?? props.defaultDate ?? null);
    };

    const recreatePicker = (): void => {
      const currentValue = props.modelValue ?? picker?.getDate() ?? props.defaultDate ?? null;
      destroyPicker();
      createPicker();
      syncValueToPicker(currentValue);
    };

    onMounted(() => {
      createPicker();
    });

    onBeforeUnmount(() => {
      destroyPicker();
    });

    watch(
      () => props.modelValue,
      (newValue) => {
        syncValueToPicker(newValue);
      },
    );

    watch(
      () => pickerOptionKeys.map((key: PickerOptionKey) => props[key]),
      () => {
        if (picker) {
          recreatePicker();
        }
      },
      { deep: true },
    );

    expose({
      input: inputRef,
      getPicker: () => picker,
      open: () => picker?.open(),
      close: () => picker?.close(),
      toggle: () => picker?.toggle(),
      clear: (triggerChange?: boolean) => picker?.clear(triggerChange),
      setDate: (value: DateInput | null | undefined, triggerChange?: boolean) =>
        picker?.setDate(value, triggerChange),
      getDate: () => picker?.getDate() ?? null,
    });

    return () =>
      h("input", {
        ...attrs,
        ref: inputRef,
        type: typeof attrs.type === "string" ? attrs.type : "text",
      });
  },
});

export { setGlobalOptions };
export type { DateInput, ThekDatePickerOptions, ThekDatePickerThemeOption } from "thekdatepicker";
export { ThekDatePicker as DatePicker };
