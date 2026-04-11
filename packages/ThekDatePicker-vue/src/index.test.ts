import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { ThekDatePickerVue } from "./index";

type VuePickerRef = InstanceType<typeof ThekDatePickerVue> & {
  setDate: (value: Date | string | null | undefined, triggerChange?: boolean) => void;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ThekDatePickerVue", () => {
  it("renders its own input and emits model updates", async () => {
    const updates: Array<Date | null> = [];
    const pickerRef = ref<VuePickerRef | null>(null);
    const model = ref<Date | null>(null);
    const container = document.createElement("div");
    document.body.appendChild(container);

    const app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(ThekDatePickerVue, {
              ref: pickerRef,
              id: "vue-date",
              modelValue: model.value,
              format: "YYYY-MM-DD",
              "onUpdate:modelValue": (value: Date | null) => {
                updates.push(value);
                model.value = value;
              },
            });
        },
      }),
    );

    app.mount(container);
    await nextTick();

    const input = container.querySelector<HTMLInputElement>("#vue-date");
    expect(input).not.toBeNull();
    expect(input?.tagName).toBe("INPUT");
    expect(input?.classList.contains("thekdp-input")).toBe(true);

    pickerRef.value?.setDate("2026-04-11", true);
    await nextTick();

    expect(updates).toHaveLength(1);
    expect(updates[0]).toBeInstanceOf(Date);
    expect(input?.value).toBe("2026-04-11");

    app.unmount();
  });

  it("recreates the picker when option props change", async () => {
    const disabled = ref(false);
    const showCalendarButton = ref(true);
    const container = document.createElement("div");
    document.body.appendChild(container);

    const app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(ThekDatePickerVue, {
              id: "reactive-date",
              disabled: disabled.value,
              format: "YYYY-MM-DD",
              showCalendarButton: showCalendarButton.value,
            });
        },
      }),
    );

    app.mount(container);
    await nextTick();

    const initialInput = container.querySelector<HTMLInputElement>("#reactive-date");
    expect(initialInput?.disabled).toBe(false);
    expect(container.querySelector("button")).not.toBeNull();

    disabled.value = true;
    showCalendarButton.value = false;
    await nextTick();
    await nextTick();

    const updatedInput = container.querySelector<HTMLInputElement>("#reactive-date");
    expect(updatedInput?.disabled).toBe(true);
    expect(container.querySelector("button")).toBeNull();

    app.unmount();
  });
});
