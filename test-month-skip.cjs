const { createDatePicker } = require('./dist/thekdatepicker.umd.cjs');

document.body.innerHTML = '<input id="d" />';
const picker = createDatePicker('#d', { defaultDate: '2024-03-31', format: 'YYYY-MM-DD' });
console.log('Initial view month:', picker.viewDate.getMonth()); // should be 2 (March)
picker.viewDate.setMonth(picker.viewDate.getMonth() - 1); // 2 - 1 = 1 (February)
console.log('After prev-month, view month:', picker.viewDate.getMonth()); // Is it 1 or 2?
