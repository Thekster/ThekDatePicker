import { createDatePicker, formatDate } from 'thekdatepicker';
import 'thekdatepicker/css/base.css';
const input = document.createElement('input');
const picker = createDatePicker(input, { format: 'YYYY-MM-DD' });
picker.setDate('2026-04-14');
formatDate(new Date(), 'YYYY-MM-DD');
