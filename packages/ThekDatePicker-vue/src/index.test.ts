import { afterEach, describe, expect, it } from "vitest";
import { createApp, defineComponent, h, nextTick, ref } from "vue";
import { ThekDatePickerVue } from "./index";

type VuePickerRef = InstanceType<typeof ThekDatePickerVue> & {
  setDate: (value: Date | string | null | undefined, triggerChange?: boolean) => void;
};

function formatLocalDate(value: Date | null): string | null {
  if (!value) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

  it("emits blur after syncing the committed model value", async () => {
    const blurSnapshots: Array<string | null> = [];
    const model = ref<Date | null>(null);
    const container = document.createElement("div");
    document.body.appendChild(container);

    const app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(ThekDatePickerVue, {
              id: "blur-date",
              modelValue: model.value,
              format: "YYYY-MM-DD",
              "onUpdate:modelValue": (value: Date | null) => {
                model.value = value;
              },
              onBlur: () => {
                blurSnapshots.push(formatLocalDate(model.value));
              },
            });
        },
      }),
    );

    app.mount(container);
    await nextTick();

    const input = container.querySelector<HTMLInputElement>("#blur-date");
    expect(input).not.toBeNull();

    if (!input) {
      app.unmount();
      throw new Error("Expected blur-date input to be rendered");
    }

    input.value = "2026-04-11";
    input.dispatchEvent(new Event("blur", { bubbles: true }));
    await nextTick();

    expect(model.value).toBeInstanceOf(Date);
    expect(model.value?.getFullYear()).toBe(2026);
    expect(model.value?.getMonth()).toBe(3);
    expect(model.value?.getDate()).toBe(11);
    expect(blurSnapshots).toEqual(["2026-04-11"]);

    app.unmount();
  });
});
