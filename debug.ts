import { ThekDatePicker } from "./src/index.js";
document.body.innerHTML = '<input id="date-input" />';
const picker = new ThekDatePicker("#date-input", { format: "YYYY-MM-DD" });
picker.setDate("2026-02-08");
picker.open();
const popover = document.querySelector(".thekdp-popover") as HTMLDivElement;
popover.dispatchEvent(
  new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
);
popover.dispatchEvent(
  new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
);
picker.open();
setTimeout(() => {
  popover.dispatchEvent(
    new KeyboardEvent("keydown", { key: "PageDown", bubbles: true, cancelable: true }),
  );
  console.log(document.activeElement?.dataset?.ts);
  console.log(new Date(2026, 2, 9).getTime());
}, 50);
