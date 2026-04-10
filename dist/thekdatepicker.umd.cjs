(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, factory(global.ThekDatePicker = {}));
})(this, function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/core/date-utils.ts
	var TOKENS = [
		"YYYY",
		"YY",
		"DD",
		"D",
		"MM",
		"M",
		"HH",
		"H",
		"hh",
		"h",
		"mm",
		"m",
		"A",
		"a"
	];
	var MASK_SEPARATORS = [
		"/",
		"-",
		".",
		",",
		":",
		" "
	];
	var TOKEN_MASK_LENGTH = {
		YYYY: 4,
		YY: 2,
		DD: 2,
		D: 2,
		MM: 2,
		M: 2,
		HH: 2,
		H: 2,
		hh: 2,
		h: 2,
		mm: 2,
		m: 2,
		A: 2,
		a: 2
	};
	var DEFAULT_MONTH_NAMES = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];
	var DEFAULT_WEEKDAY_NAMES = [
		"Sun",
		"Mon",
		"Tue",
		"Wed",
		"Thu",
		"Fri",
		"Sat"
	];
	function pad2(value) {
		return String(value).padStart(2, "0");
	}
	function isValidDate(date) {
		return !Number.isNaN(date.getTime());
	}
	var ISO_DATE_RE = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?(?:Z|[+-]\d{2}:?\d{2})?$/;
	function parseIsoDateString(value) {
		const match = ISO_DATE_RE.exec(value);
		if (!match) return null;
		const [, yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr] = match;
		const year = Number(yearStr);
		const month = Number(monthStr);
		const day = Number(dayStr);
		const hour = hourStr !== void 0 ? Number(hourStr) : 0;
		const minute = minuteStr !== void 0 ? Number(minuteStr) : 0;
		const second = secondStr !== void 0 ? Number(secondStr) : 0;
		if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month - 1)) return null;
		if (hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) return null;
		const date = new Date(year, month - 1, day, hour, minute, second, 0);
		return isValidDate(date) ? date : null;
	}
	function toLocalStartOfDay(date) {
		const clone = new Date(date);
		clone.setHours(0, 0, 0, 0);
		return clone;
	}
	function daysInMonth(year, monthIndex) {
		return new Date(year, monthIndex + 1, 0).getDate();
	}
	function resolveTwoDigitYear(value, now = /* @__PURE__ */ new Date()) {
		const currentYear = now.getFullYear();
		let resolved = Math.floor(currentYear / 100) * 100 + value;
		if (resolved - currentYear > 50) resolved -= 100;
		else if (currentYear - resolved > 50) resolved += 100;
		return resolved;
	}
	var formatTokenCache = /* @__PURE__ */ new Map();
	function tokenizeFormat(format) {
		const cached = formatTokenCache.get(format);
		if (cached) return cached;
		const parts = [];
		let i = 0;
		while (i < format.length) {
			if (format[i] === "[") {
				const end = format.indexOf("]", i);
				if (end !== -1) {
					const literal = format.slice(i + 1, end);
					for (const char of literal) parts.push({
						type: "literal",
						value: char
					});
					i = end + 1;
					continue;
				}
			}
			let matchedToken = null;
			for (const token of TOKENS) if (format.slice(i, i + token.length) === token) {
				matchedToken = token;
				break;
			}
			if (matchedToken) {
				parts.push({
					type: "token",
					value: matchedToken
				});
				i += matchedToken.length;
				continue;
			}
			parts.push({
				type: "literal",
				value: format[i]
			});
			i += 1;
		}
		const tokenized = parts;
		formatTokenCache.set(format, tokenized);
		return tokenized;
	}
	function applyMaskToInput(value, format) {
		const digits = value.replace(/\D/g, "");
		const meridiemChars = value.replace(/[^aApPmM]/g, "");
		const parts = tokenizeFormat(format);
		let out = "";
		let digitIndex = 0;
		let meridiemIndex = 0;
		let hasAnyOutput = false;
		function hasRemainingTokenData(startIndex) {
			let d = digitIndex;
			let m = meridiemIndex;
			for (let i = startIndex; i < parts.length; i += 1) {
				const part = parts[i];
				if (part.type === "literal") continue;
				if (part.value === "A" || part.value === "a") {
					if (m < meridiemChars.length) return true;
					continue;
				}
				const len = TOKEN_MASK_LENGTH[part.value];
				if (d < digits.length && len > 0) return true;
				d += Math.min(len, Math.max(0, digits.length - d));
			}
			return false;
		}
		for (let i = 0; i < parts.length; i += 1) {
			const part = parts[i];
			if (part.type === "literal") {
				if (!hasAnyOutput) break;
				if (hasRemainingTokenData(i + 1)) out += part.value;
				continue;
			}
			if (part.value === "A" || part.value === "a") {
				const c = meridiemChars[meridiemIndex];
				if (!c) break;
				const isPm = c.toLowerCase() === "p";
				const first = part.value === "A" ? isPm ? "P" : "A" : isPm ? "p" : "a";
				const next = meridiemChars[meridiemIndex + 1];
				if (!!next && /[mM]/.test(next)) {
					out += `${first}${part.value === "A" ? "M" : "m"}`;
					meridiemIndex += 2;
				} else {
					out += first;
					meridiemIndex += 1;
				}
				hasAnyOutput = true;
				continue;
			}
			const len = TOKEN_MASK_LENGTH[part.value];
			if (digitIndex >= digits.length) break;
			const take = digits.slice(digitIndex, digitIndex + len);
			if (!take) break;
			out += take;
			digitIndex += take.length;
			hasAnyOutput = true;
			if (take.length < len) break;
		}
		return out.trimEnd();
	}
	function normalizeInputSeparatorsToFormat(value, format) {
		const input = value.trim();
		if (!input) return input;
		const parts = tokenizeFormat(format);
		let cursor = 0;
		let out = "";
		for (const part of parts) {
			if (part.type === "literal") {
				const ch = input[cursor];
				if (ch === part.value) {
					out += part.value;
					cursor += 1;
					continue;
				}
				if (ch && MASK_SEPARATORS.includes(ch)) {
					out += part.value;
					cursor += 1;
					continue;
				}
				out += part.value;
				continue;
			}
			if (part.value === "A" || part.value === "a") {
				const ch = input[cursor];
				if (!ch || !/[aApP]/.test(ch)) return value;
				const pm = ch.toLowerCase() === "p";
				out += part.value === "A" ? pm ? "PM" : "AM" : pm ? "pm" : "am";
				if (/^[aApP][mM]$/.test(input.slice(cursor, cursor + 2))) cursor += 2;
				else cursor += 1;
				continue;
			}
			let minDigits = 1;
			let maxDigits = 2;
			if (part.value === "YYYY") {
				minDigits = 4;
				maxDigits = 4;
			} else if (part.value === "YY") {
				minDigits = 2;
				maxDigits = 2;
			} else if (part.value === "DD" || part.value === "MM" || part.value === "HH" || part.value === "hh" || part.value === "mm") {
				minDigits = 2;
				maxDigits = 2;
			}
			let read = 0;
			while (read < maxDigits && /^\d$/.test(input[cursor + read] ?? "")) read += 1;
			if (read < minDigits) return value;
			out += input.slice(cursor, cursor + read);
			cursor += read;
		}
		return out;
	}
	function parseNumber(source, minDigits, maxDigits) {
		for (let len = maxDigits; len >= minDigits; len -= 1) {
			const chunk = source.slice(0, len);
			if (chunk.length !== len) continue;
			if (!/^\d+$/.test(chunk)) continue;
			return {
				value: Number(chunk),
				read: len
			};
		}
		return null;
	}
	function parseDateByFormat(value, format) {
		const input = value.trim().replace(/[\u200B-\u200D\uFEFF\u00A0]/g, "");
		if (!input) return null;
		const parts = tokenizeFormat(format);
		let cursor = 0;
		const now = /* @__PURE__ */ new Date();
		let year = now.getFullYear();
		let month = 1;
		let day = 1;
		let hour = 0;
		let minute = 0;
		let usesMeridiem = false;
		let meridiem = null;
		for (const part of parts) {
			if (part.type === "literal") {
				if (cursor >= input.length) return null;
				if (input[cursor] === part.value) {
					cursor += 1;
					continue;
				}
				if (MASK_SEPARATORS.includes(part.value)) {
					if (MASK_SEPARATORS.includes(input[cursor])) {
						cursor += 1;
						continue;
					}
					return null;
				}
				if (/\s/.test(part.value) && /\s/.test(input[cursor])) {
					while (cursor < input.length && /\s/.test(input[cursor])) cursor += 1;
					continue;
				}
				return null;
			}
			while (cursor < input.length && /\s/.test(input[cursor])) cursor += 1;
			const remaining = input.slice(cursor);
			let parsed = null;
			switch (part.value) {
				case "YYYY":
					parsed = parseNumber(remaining, 4, 4);
					if (!parsed) return null;
					year = parsed.value;
					break;
				case "YY":
					parsed = parseNumber(remaining, 2, 2);
					if (!parsed) return null;
					year = resolveTwoDigitYear(parsed.value, now);
					break;
				case "MM":
					parsed = parseNumber(remaining, 2, 2);
					if (!parsed) return null;
					month = parsed.value;
					break;
				case "M":
					parsed = parseNumber(remaining, 1, 2);
					if (!parsed) return null;
					month = parsed.value;
					break;
				case "DD":
					parsed = parseNumber(remaining, 2, 2);
					if (!parsed) return null;
					day = parsed.value;
					break;
				case "D":
					parsed = parseNumber(remaining, 1, 2);
					if (!parsed) return null;
					day = parsed.value;
					break;
				case "HH":
					parsed = parseNumber(remaining, 2, 2);
					if (!parsed) return null;
					hour = parsed.value;
					break;
				case "H":
					parsed = parseNumber(remaining, 1, 2);
					if (!parsed) return null;
					hour = parsed.value;
					break;
				case "hh":
					parsed = parseNumber(remaining, 2, 2);
					if (!parsed) return null;
					hour = parsed.value;
					usesMeridiem = true;
					break;
				case "h":
					parsed = parseNumber(remaining, 1, 2);
					if (!parsed) return null;
					hour = parsed.value;
					usesMeridiem = true;
					break;
				case "mm":
					parsed = parseNumber(remaining, 2, 2);
					if (!parsed) return null;
					minute = parsed.value;
					break;
				case "m":
					parsed = parseNumber(remaining, 1, 2);
					if (!parsed) return null;
					minute = parsed.value;
					break;
				case "A": {
					const m = remaining.slice(0, 2).toUpperCase();
					if (m !== "AM" && m !== "PM") return null;
					meridiem = m;
					parsed = {
						value: 0,
						read: 2
					};
					usesMeridiem = true;
					break;
				}
				case "a": {
					const m = remaining.slice(0, 2).toLowerCase();
					if (m !== "am" && m !== "pm") return null;
					meridiem = m.toUpperCase();
					parsed = {
						value: 0,
						read: 2
					};
					usesMeridiem = true;
					break;
				}
			}
			cursor += parsed.read;
		}
		while (cursor < input.length && /\s/.test(input[cursor])) cursor += 1;
		if (cursor !== input.length) return null;
		if (month < 1 || month > 12) return null;
		if (day < 1 || day > daysInMonth(year, month - 1)) return null;
		if (usesMeridiem) {
			if (hour < 1 || hour > 12) return null;
			const h12 = hour % 12;
			hour = meridiem === "PM" ? h12 + 12 : h12;
		} else if (hour < 0 || hour > 23) return null;
		if (minute < 0 || minute > 59) return null;
		const date = new Date(year, month - 1, day, hour, minute, 0, 0);
		return isValidDate(date) ? date : null;
	}
	function formatDate(date, format) {
		const h24 = date.getHours();
		const h12 = (h24 + 11) % 12 + 1;
		const replacements = {
			YYYY: String(date.getFullYear()),
			YY: pad2(date.getFullYear() % 100),
			MM: pad2(date.getMonth() + 1),
			M: String(date.getMonth() + 1),
			DD: pad2(date.getDate()),
			D: String(date.getDate()),
			HH: pad2(h24),
			H: String(h24),
			hh: pad2(h12),
			h: String(h12),
			mm: pad2(date.getMinutes()),
			m: String(date.getMinutes()),
			A: h24 >= 12 ? "PM" : "AM",
			a: h24 >= 12 ? "pm" : "am"
		};
		return tokenizeFormat(format).map((part) => part.type === "token" ? replacements[part.value] : part.value).join("");
	}
	function isSameDay(a, b) {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
	}
	function getMonthNames(locale) {
		try {
			const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
			return Array.from({ length: 12 }, (_, month) => formatter.format(new Date(2026, month, 1)));
		} catch {
			return [...DEFAULT_MONTH_NAMES];
		}
	}
	function getWeekdayNames(locale) {
		try {
			const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
			const sunday = new Date(2026, 0, 4);
			return Array.from({ length: 7 }, (_, offset) => {
				const d = new Date(sunday);
				d.setDate(sunday.getDate() + offset);
				return formatter.format(d);
			});
		} catch {
			return [...DEFAULT_WEEKDAY_NAMES];
		}
	}
	function rotateWeekdayLabels(labels, weekStartsOn) {
		return labels.slice(weekStartsOn).concat(labels.slice(0, weekStartsOn));
	}
	function formatSpokenDate(date, locale) {
		try {
			return new Intl.DateTimeFormat(locale, {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric"
			}).format(date);
		} catch {
			return `${DEFAULT_MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
		}
	}
	function getAllowedInputSeparators(_options) {
		return [...MASK_SEPARATORS];
	}
	function formatUsesMeridiem(format) {
		return tokenizeFormat(format).some((part) => part.type === "token" && (part.value === "A" || part.value === "a"));
	}
	function formatHasTimeTokens(format) {
		return tokenizeFormat(format).some((part) => part.type === "token" && (part.value === "HH" || part.value === "H" || part.value === "hh" || part.value === "h" || part.value === "mm" || part.value === "m" || part.value === "A" || part.value === "a"));
	}
	//#endregion
	//#region src/core/thekdatepicker-dom.ts
	function createTriggerButton(cssPrefix = "thekdp") {
		const button = document.createElement("button");
		button.type = "button";
		button.className = `${cssPrefix}-trigger-btn`;
		button.setAttribute("aria-label", "Toggle calendar");
		button.innerHTML = `
    <svg class="${cssPrefix}-trigger-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" ry="2.5" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" stroke-width="1.8"></line>
      <line x1="8" y1="2.5" x2="8" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <line x1="16" y1="2.5" x2="16" y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <circle cx="8" cy="12.5" r="0.95" fill="currentColor"></circle>
      <circle cx="12" cy="12.5" r="0.95" fill="currentColor"></circle>
      <circle cx="16" cy="12.5" r="0.95" fill="currentColor"></circle>
      <circle cx="8" cy="16.5" r="0.95" fill="currentColor"></circle>
      <circle cx="12" cy="16.5" r="0.95" fill="currentColor"></circle>
    </svg>
  `;
		return button;
	}
	function warningSvgMarkup(cssPrefix = "thekdp") {
		return `
    <svg class="${cssPrefix}-indicator-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3.5L21 19.5H3L12 3.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
      <line x1="12" y1="9" x2="12" y2="13.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></line>
      <circle cx="12" cy="16.4" r="1" fill="currentColor"></circle>
    </svg>
  `;
	}
	function createSuspiciousIndicator(cssPrefix = "thekdp") {
		const suspiciousIndicator = document.createElement("span");
		suspiciousIndicator.className = `${cssPrefix}-suspicious-indicator`;
		suspiciousIndicator.setAttribute("aria-hidden", "true");
		suspiciousIndicator.innerHTML = warningSvgMarkup(cssPrefix);
		suspiciousIndicator.hidden = true;
		return suspiciousIndicator;
	}
	function createRevertIndicator(cssPrefix = "thekdp") {
		const revertIndicator = document.createElement("span");
		revertIndicator.className = `${cssPrefix}-revert-indicator`;
		revertIndicator.setAttribute("aria-hidden", "true");
		revertIndicator.innerHTML = warningSvgMarkup(cssPrefix);
		revertIndicator.hidden = true;
		return revertIndicator;
	}
	function createAssistiveText(cssPrefix = "thekdp", suffix) {
		const text = document.createElement("span");
		text.className = `${cssPrefix}-sr-only`;
		text.id = `${cssPrefix}-${suffix}-${Math.random().toString(36).slice(2, 9)}`;
		return text;
	}
	function createPickerPopover(cssPrefix = "thekdp") {
		const picker = document.createElement("div");
		picker.className = `${cssPrefix}-popover`;
		picker.hidden = true;
		picker.tabIndex = -1;
		picker.style.touchAction = "manipulation";
		const header = document.createElement("div");
		header.className = `${cssPrefix}-header`;
		const createNavBtn = (action, label, text) => {
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = `${cssPrefix}-nav-btn`;
			btn.dataset.action = action;
			btn.setAttribute("aria-label", label);
			btn.textContent = text;
			return btn;
		};
		header.appendChild(createNavBtn("prev-year", "Previous year", "«"));
		header.appendChild(createNavBtn("prev-month", "Previous month", "‹"));
		const currentMonth = document.createElement("span");
		currentMonth.className = `${cssPrefix}-current-month`;
		currentMonth.setAttribute("aria-live", "polite");
		header.appendChild(currentMonth);
		header.appendChild(createNavBtn("next-month", "Next month", "›"));
		header.appendChild(createNavBtn("next-year", "Next year", "»"));
		const weekdays = document.createElement("div");
		weekdays.className = `${cssPrefix}-weekdays`;
		weekdays.setAttribute("role", "row");
		const days = document.createElement("div");
		days.className = `${cssPrefix}-days`;
		days.setAttribute("role", "grid");
		days.setAttribute("aria-readonly", "true");
		const footer = document.createElement("div");
		footer.className = `${cssPrefix}-footer`;
		const time = document.createElement("div");
		time.className = `${cssPrefix}-time`;
		const actions = document.createElement("div");
		actions.className = `${cssPrefix}-actions`;
		const todayBtn = document.createElement("button");
		todayBtn.type = "button";
		todayBtn.className = `${cssPrefix}-link-btn`;
		todayBtn.dataset.action = "today";
		todayBtn.textContent = "Now";
		const okBtn = document.createElement("button");
		okBtn.type = "button";
		okBtn.className = `${cssPrefix}-ok-btn`;
		okBtn.dataset.action = "ok";
		okBtn.textContent = "OK";
		actions.appendChild(todayBtn);
		actions.appendChild(okBtn);
		footer.appendChild(time);
		footer.appendChild(actions);
		picker.appendChild(header);
		picker.appendChild(weekdays);
		picker.appendChild(days);
		picker.appendChild(footer);
		return picker;
	}
	//#endregion
	//#region src/core/thekdatepicker-suspicious.ts
	function isSuspiciousDate(date, options) {
		if (!options.suspiciousWarning) return false;
		const year = date.getFullYear();
		const nowYear = (/* @__PURE__ */ new Date()).getFullYear();
		const span = options.suspiciousYearSpan;
		const lowerBound = nowYear - span;
		const upperBound = nowYear + span;
		if (year < lowerBound || year > upperBound) return true;
		if (options.suspiciousMinYear != null && year < options.suspiciousMinYear) return true;
		if (options.suspiciousMaxYear != null && year > options.suspiciousMaxYear) return true;
		return false;
	}
	//#endregion
	//#region src/core/thekdatepicker-theme.ts
	var THEME_VAR_MAP = {
		primary: "--thekdp-primary",
		primaryStrong: "--thekdp-primary-strong",
		primaryContrast: "--thekdp-primary-contrast",
		bgSurface: "--thekdp-bg-surface",
		bgPanel: "--thekdp-bg-panel",
		border: "--thekdp-border",
		textMain: "--thekdp-text-main",
		textMuted: "--thekdp-text-muted",
		shadow: "--thekdp-shadow",
		radius: "--thekdp-radius",
		fontFamily: "--thekdp-font-family",
		controlHeight: "--thekdp-control-height"
	};
	function applyThemeVars(theme, targets) {
		for (const cssVar of Object.values(THEME_VAR_MAP)) for (const target of targets) target.style.removeProperty(cssVar);
		const entries = Object.entries(theme);
		if (!entries.length) return;
		for (const [key, value] of entries) {
			if (!value) continue;
			const cssVar = THEME_VAR_MAP[key];
			if (!cssVar) continue;
			for (const target of targets) target.style.setProperty(cssVar, value);
		}
	}
	//#endregion
	//#region src/core/thekdatepicker-input.ts
	function isMaskChar(char, usesMeridiem) {
		if (/^\d$/.test(char)) return true;
		if (!usesMeridiem) return false;
		return /^[aApPmM]$/.test(char);
	}
	function countMaskChars(value, usesMeridiem) {
		let count = 0;
		for (const char of value) if (isMaskChar(char, usesMeridiem)) count += 1;
		return count;
	}
	function caretIndexForMaskCharCount(value, maskChars, usesMeridiem) {
		if (maskChars <= 0) return 0;
		let count = 0;
		for (let i = 0; i < value.length; i += 1) {
			if (!isMaskChar(value[i], usesMeridiem)) continue;
			count += 1;
			if (count >= maskChars) return i + 1;
		}
		return value.length;
	}
	function applyMaskedInputWithCaret(input, format) {
		const usesMeridiem = formatUsesMeridiem(format);
		const previousValue = input.value;
		const caretStart = input.selectionStart ?? previousValue.length;
		const nextValue = applyMaskToInput(previousValue, format);
		if (nextValue === previousValue) return;
		const maskCharsBeforeCaret = countMaskChars(previousValue.slice(0, caretStart), usesMeridiem);
		input.value = nextValue;
		const nextCaret = caretIndexForMaskCharCount(nextValue, maskCharsBeforeCaret, usesMeridiem);
		input.setSelectionRange(nextCaret, nextCaret);
	}
	function isAllowedInputKey(key, format, allowedSeparators) {
		const separators = new Set(allowedSeparators);
		if (/^\d$/.test(key) || separators.has(key)) return true;
		return formatUsesMeridiem(format) && /^[aApPmM]$/.test(key);
	}
	//#endregion
	//#region src/core/thekdatepicker-navigation.ts
	function getDefaultFocusedDay(selectedDate, minDate, maxDate, isDateDisabled) {
		const normalized = toLocalStartOfDay(selectedDate ? new Date(selectedDate) : /* @__PURE__ */ new Date());
		if (isDateDisabled(normalized)) {
			if (minDate) return toLocalStartOfDay(minDate);
			if (maxDate) return toLocalStartOfDay(maxDate);
		}
		return normalized;
	}
	function moveFocusedDay(baseTs, deltaDays) {
		const base = new Date(baseTs);
		base.setDate(base.getDate() + deltaDays);
		return base;
	}
	function moveFocusToWeekBoundary(baseTs, weekStartsOn, toEnd) {
		const base = new Date(baseTs);
		const startOffset = (base.getDay() - weekStartsOn + 7) % 7;
		const endOffset = 6 - startOffset;
		base.setDate(base.getDate() + (toEnd ? endOffset : -startOffset));
		return base;
	}
	function moveFocusedMonth(baseTs, deltaMonths) {
		const base = new Date(baseTs);
		const day = base.getDate();
		base.setDate(1);
		base.setMonth(base.getMonth() + deltaMonths);
		base.setDate(Math.min(day, new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate()));
		return base;
	}
	//#endregion
	//#region src/core/thekdatepicker-render.ts
	function renderWeekdays(weekdaysEl, weekdayNames, weekStartsOn, rotateWeekdayLabels, cssPrefix) {
		weekdaysEl.innerHTML = "";
		rotateWeekdayLabels(weekdayNames, weekStartsOn).forEach((day) => {
			const cell = document.createElement("div");
			cell.className = `${cssPrefix}-weekday-cell`;
			cell.setAttribute("role", "columnheader");
			cell.textContent = day;
			weekdaysEl.appendChild(cell);
		});
	}
	function resolveMonthLabel(localizedMonthNames, month, year, locale) {
		return `${localizedMonthNames[month] ?? getMonthNames(locale)[month]} ${year}`;
	}
	function ensureDayCells(daysEl, cssPrefix) {
		const hasRows = daysEl.querySelectorAll(`.${cssPrefix}-days-row`).length === 6;
		const existingCells = daysEl.querySelectorAll(`.${cssPrefix}-day-cell`);
		if (hasRows && existingCells.length === 42) return [...existingCells];
		const dayCellEls = [];
		daysEl.textContent = "";
		const fragment = document.createDocumentFragment();
		for (let r = 0; r < 6; r += 1) {
			const row = document.createElement("div");
			row.className = `${cssPrefix}-days-row`;
			row.setAttribute("role", "row");
			for (let c = 0; c < 7; c += 1) {
				const cell = document.createElement("button");
				cell.type = "button";
				cell.setAttribute("role", "gridcell");
				cell.dataset.action = "day";
				cell.className = `${cssPrefix}-day-cell`;
				row.appendChild(cell);
				dayCellEls.push(cell);
			}
			fragment.appendChild(row);
		}
		daysEl.appendChild(fragment);
		return dayCellEls;
	}
	function renderDayGrid(args) {
		const { dayCellEls, viewDate, selectedDate, focusedDayTs, locale, weekStartsOn, cssPrefix, isDateDisabled } = args;
		const year = viewDate.getFullYear();
		const month = viewDate.getMonth();
		const monthStartDay = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7;
		const gridStart = new Date(year, month, 1 - monthStartDay);
		const today = toLocalStartOfDay(/* @__PURE__ */ new Date());
		const selected = selectedDate ? toLocalStartOfDay(selectedDate) : null;
		const current = new Date(gridStart);
		for (let i = 0; i < 42; i += 1) {
			if (i > 0) current.setDate(current.getDate() + 1);
			const inCurrentMonth = current.getMonth() === month;
			const isTodayDate = isSameDay(current, today);
			const isSelectedDate = selected ? isSameDay(current, selected) : false;
			const dayTs = current.getTime();
			const disabled = isDateDisabled(current);
			const isFocusedDate = focusedDayTs === dayTs;
			const cell = dayCellEls[i];
			cell.className = `${cssPrefix}-day-cell` + (!inCurrentMonth ? ` ${cssPrefix}-day-cell-muted` : "") + (isTodayDate ? ` ${cssPrefix}-day-cell-today` : "") + (isSelectedDate ? ` ${cssPrefix}-day-cell-selected` : "") + (disabled ? ` ${cssPrefix}-day-cell-disabled` : "");
			cell.dataset.ts = String(dayTs);
			cell.disabled = disabled;
			cell.tabIndex = !disabled && isFocusedDate ? 0 : -1;
			cell.setAttribute("aria-selected", String(isSelectedDate));
			cell.toggleAttribute("aria-current", isTodayDate);
			cell.setAttribute("aria-label", formatSpokenDate(current, locale));
			cell.textContent = String(current.getDate());
		}
	}
	function ensureTimeInputs(timeContainer, actions, cssPrefix) {
		let hourInputEl = timeContainer.querySelector("[data-time-unit=\"hour\"]");
		let minuteInputEl = timeContainer.querySelector("[data-time-unit=\"minute\"]");
		if (!hourInputEl || !minuteInputEl) {
			timeContainer.innerHTML = "";
			const label = document.createElement("label");
			label.className = `${cssPrefix}-time-label`;
			label.htmlFor = `${cssPrefix}-time-hour`;
			label.textContent = "Time";
			const hourInput = document.createElement("input");
			hourInput.id = `${cssPrefix}-time-hour`;
			hourInput.setAttribute("aria-label", "Hour");
			hourInput.className = `${cssPrefix}-time-input`;
			hourInput.type = "number";
			hourInput.min = "0";
			hourInput.max = "23";
			hourInput.dataset.timeUnit = "hour";
			const colon = document.createElement("span");
			colon.textContent = ":";
			const minuteInput = document.createElement("input");
			minuteInput.setAttribute("aria-label", "Minute");
			minuteInput.className = `${cssPrefix}-time-input`;
			minuteInput.type = "number";
			minuteInput.min = "0";
			minuteInput.max = "59";
			minuteInput.dataset.timeUnit = "minute";
			timeContainer.appendChild(label);
			timeContainer.appendChild(hourInput);
			timeContainer.appendChild(colon);
			timeContainer.appendChild(minuteInput);
			hourInputEl = hourInput;
			minuteInputEl = minuteInput;
		}
		timeContainer.hidden = false;
		actions.classList.add(`${cssPrefix}-actions-with-ok`);
		return {
			hourInputEl: hourInputEl ?? null,
			minuteInputEl: minuteInputEl ?? null
		};
	}
	function syncTimeInputs(hourInputEl, minuteInputEl, selectedDate) {
		if (hourInputEl) hourInputEl.value = String(selectedDate.getHours());
		if (minuteInputEl) minuteInputEl.value = String(selectedDate.getMinutes());
	}
	function hideTimeInputs(timeContainer, actions, cssPrefix) {
		timeContainer.hidden = true;
		actions.classList.remove(`${cssPrefix}-actions-with-ok`);
	}
	//#endregion
	//#region src/core/config-utils.ts
	var THEME_TEMPLATES = {
		light: {
			bgSurface: "#ffffff",
			bgPanel: "#ebf0f7",
			border: "#d8dee6",
			textMain: "#1d2838",
			textMuted: "#6b7a90",
			primary: "#2f7fe4",
			primaryStrong: "#1f6bcc",
			primaryContrast: "#ffffff",
			shadow: "0 0.875rem 1.875rem rgba(13, 21, 33, 0.18)",
			radius: "0.375rem",
			fontFamily: "inherit",
			controlHeight: "2rem"
		},
		dark: {
			bgSurface: "#111827",
			bgPanel: "#1f2937",
			border: "#374151",
			textMain: "#f3f4f6",
			textMuted: "#9ca3af",
			primary: "#60a5fa",
			primaryStrong: "#3b82f6",
			primaryContrast: "#0f172a",
			shadow: "0 1rem 2.125rem rgba(0, 0, 0, 0.45)",
			radius: "0.375rem",
			fontFamily: "inherit",
			controlHeight: "2rem"
		}
	};
	var globalOptions = {};
	function normalizeLiteral(value) {
		return value.replace(/\s+/g, " ");
	}
	function getLocaleDateFormat(locale) {
		const parts = new Intl.DateTimeFormat(locale, {
			day: "2-digit",
			month: "2-digit",
			year: "numeric"
		}).formatToParts(new Date(2006, 10, 22));
		let format = "";
		for (const part of parts) if (part.type === "day") format += "DD";
		else if (part.type === "month") format += "MM";
		else if (part.type === "year") format += part.value.length === 2 ? "YY" : "YYYY";
		else if (part.type === "literal") format += normalizeLiteral(part.value);
		return format || "DD/MM/YYYY";
	}
	function getLocaleTimeFormat(locale) {
		const parts = new Intl.DateTimeFormat(locale, {
			hour: "2-digit",
			minute: "2-digit"
		}).formatToParts(new Date(2e3, 0, 1, 21, 5));
		const hasDayPeriod = parts.some((part) => part.type === "dayPeriod");
		let format = "";
		for (const part of parts) if (part.type === "hour") format += hasDayPeriod ? "hh" : "HH";
		else if (part.type === "minute") format += "mm";
		else if (part.type === "dayPeriod") format += "A";
		else if (part.type === "literal") format += normalizeLiteral(part.value);
		return format || "HH:mm";
	}
	function getLocaleWeekStartsOn(locale) {
		try {
			const effectiveLocale = locale ?? new Intl.DateTimeFormat().resolvedOptions().locale;
			const firstDay = new Intl.Locale(effectiveLocale).weekInfo?.firstDay;
			if (typeof firstDay !== "number") return void 0;
			if (firstDay === 7) return 0;
			if (firstDay >= 0 && firstDay <= 6) return firstDay;
		} catch {}
	}
	function getLocaleDefaults(locale) {
		return {
			format: getLocaleDateFormat(locale),
			timeFormat: getLocaleTimeFormat(locale),
			weekStartsOn: getLocaleWeekStartsOn(locale)
		};
	}
	function resolveThemeOption(theme) {
		if (!theme) return {};
		if (theme === "light" || theme === "dark") return { ...THEME_TEMPLATES[theme] };
		if (theme === "auto") return { ...THEME_TEMPLATES[resolveAutoThemeTemplate("data-theme")] };
		return { ...theme };
	}
	function resolveAutoThemeTemplate(themeAttribute) {
		if (typeof document === "undefined") return "light";
		const attr = document.documentElement.getAttribute(themeAttribute);
		if (attr === "dark") return "dark";
		if (attr === "light") return "light";
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
		return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	}
	function mergeThemeOptions(baseTheme, overrideTheme) {
		if (overrideTheme == null) return baseTheme;
		if (baseTheme == null) return overrideTheme;
		if (typeof baseTheme === "string" || typeof overrideTheme === "string") return overrideTheme;
		return {
			...baseTheme,
			...overrideTheme
		};
	}
	function mergeOptions(base, override) {
		return {
			...base,
			...override,
			theme: mergeThemeOptions(base.theme, override.theme)
		};
	}
	function cloneGlobalOptions(options) {
		return {
			...options,
			theme: options.theme && typeof options.theme === "object" ? { ...options.theme } : options.theme
		};
	}
	function setGlobalOptions(options) {
		globalOptions = mergeOptions(globalOptions, options);
	}
	function getGlobalOptions() {
		return cloneGlobalOptions(globalOptions);
	}
	function resetGlobalOptions() {
		globalOptions = {};
	}
	function normalizeDateInput(value) {
		if (value == null) return null;
		if (value instanceof Date) return isValidDate(value) ? new Date(value) : null;
		const isoParsed = parseIsoDateString(value);
		if (isoParsed) return isoParsed;
		return null;
	}
	function parseConfiguredDateInput(value, options) {
		if (value == null) return null;
		if (value instanceof Date) return isValidDate(value) ? new Date(value) : null;
		const parsedByFormat = parseDateByFormat(value, fullFormat(options));
		if (parsedByFormat) return parsedByFormat;
		const normalizedParsed = parseDateByFormat(normalizeInputSeparatorsToFormat(value, fullFormat(options)), fullFormat(options));
		if (normalizedParsed) return normalizedParsed;
		return normalizeDateInput(value);
	}
	function fullFormat(options) {
		if (formatHasTimeTokens(options.format)) return options.format;
		return options.enableTime ? `${options.format} ${options.timeFormat}` : options.format;
	}
	function clampDate(date, minDate, maxDate) {
		const ts = date.getTime();
		if (minDate && ts < minDate.getTime()) return new Date(minDate);
		if (maxDate && ts > maxDate.getTime()) return new Date(maxDate);
		return date;
	}
	function resolveOptions(options) {
		const merged = mergeOptions(globalOptions, options);
		const useLocaleDefaults = merged.useLocaleDefaults ?? false;
		const locale = merged.locale;
		const localeDefaults = useLocaleDefaults ? getLocaleDefaults(locale) : {};
		const format = merged.format ?? localeDefaults.format ?? "DD/MM/YYYY";
		const enableTime = merged.enableTime ?? false;
		const timeFormat = merged.timeFormat ?? localeDefaults.timeFormat ?? "HH:mm";
		const placeholder = merged.placeholder ?? fullFormat({
			format,
			timeFormat,
			enableTime
		});
		const disabled = merged.disabled ?? false;
		const appendTo = merged.appendTo ?? null;
		const weekStartsOn = merged.weekStartsOn ?? localeDefaults.weekStartsOn ?? 0;
		const closeOnSelect = merged.closeOnSelect ?? true;
		const showCalendarButton = merged.showCalendarButton ?? true;
		const openOnInputClick = merged.openOnInputClick ?? false;
		const zIndex = Number.isFinite(merged.zIndex) ? Number(merged.zIndex) : 9999;
		const reactiveTheme = merged.reactiveTheme ?? false;
		const themeAttribute = merged.themeAttribute ?? "data-theme";
		const themeMode = typeof merged.theme === "string" ? merged.theme : "custom";
		const theme = resolveThemeOption(themeMode === "auto" ? resolveAutoThemeTemplate(themeAttribute) : merged.theme);
		const suspiciousWarning = merged.suspiciousWarning ?? false;
		const suspiciousYearSpan = Math.max(0, merged.suspiciousYearSpan ?? 100);
		const suspiciousMinYear = merged.suspiciousMinYear ?? null;
		const suspiciousMaxYear = merged.suspiciousMaxYear ?? null;
		const suspiciousMessage = merged.suspiciousMessage ?? "Suspicious date value";
		const revertWarning = merged.revertWarning ?? true;
		const revertMessage = merged.revertMessage ?? "Invalid input value";
		const cssPrefix = merged.cssPrefix ?? "thekdp";
		return {
			format,
			locale,
			useLocaleDefaults,
			enableTime,
			timeFormat,
			defaultDate: parseConfiguredDateInput(merged.defaultDate, {
				format,
				timeFormat,
				enableTime
			}),
			minDate: parseConfiguredDateInput(merged.minDate, {
				format,
				timeFormat,
				enableTime
			}),
			maxDate: parseConfiguredDateInput(merged.maxDate, {
				format,
				timeFormat,
				enableTime
			}),
			placeholder,
			disabled,
			appendTo,
			weekStartsOn,
			closeOnSelect,
			showCalendarButton,
			openOnInputClick,
			zIndex,
			theme,
			reactiveTheme,
			themeAttribute,
			themeMode,
			suspiciousWarning,
			suspiciousYearSpan,
			suspiciousMinYear,
			suspiciousMaxYear,
			suspiciousMessage,
			revertWarning,
			revertMessage,
			cssPrefix,
			onChange: merged.onChange,
			onOpen: merged.onOpen,
			onClose: merged.onClose
		};
	}
	function extractInput(input, options) {
		const format = fullFormat(options);
		const primary = parseDateByFormat(input, format);
		if (primary) return primary;
		const flexible = parseDateByFormat(normalizeInputSeparatorsToFormat(input, format), format);
		if (flexible) return flexible;
		const relaxedFormat = format.replaceAll("DD", "D").replaceAll("MM", "M").replaceAll("HH", "H").replaceAll("hh", "h").replaceAll("mm", "m");
		if (relaxedFormat !== format) {
			const relaxedPrimary = parseDateByFormat(input, relaxedFormat);
			if (relaxedPrimary) return relaxedPrimary;
			const relaxedFlexible = parseDateByFormat(normalizeInputSeparatorsToFormat(input, relaxedFormat), relaxedFormat);
			if (relaxedFlexible) return relaxedFlexible;
		}
		return null;
	}
	//#endregion
	//#region src/core/thekdatepicker-global.ts
	var registeredPickers = /* @__PURE__ */ new Set();
	var scrollListenerOptions = {
		capture: true,
		passive: true
	};
	function handleDocumentPointerDown(event) {
		for (const picker of registeredPickers) picker.onGlobalPointerDown(event);
	}
	function handleViewportChange() {
		for (const picker of registeredPickers) picker.onGlobalViewportChange();
	}
	function bindGlobalListeners() {
		document.addEventListener("pointerdown", handleDocumentPointerDown);
		window.addEventListener("resize", handleViewportChange);
		window.addEventListener("scroll", handleViewportChange, scrollListenerOptions);
	}
	function unbindGlobalListeners() {
		document.removeEventListener("pointerdown", handleDocumentPointerDown);
		window.removeEventListener("resize", handleViewportChange);
		window.removeEventListener("scroll", handleViewportChange, scrollListenerOptions);
	}
	function registerGlobalPicker(picker) {
		if (registeredPickers.size === 0) bindGlobalListeners();
		registeredPickers.add(picker);
	}
	function unregisterGlobalPicker(picker) {
		registeredPickers.delete(picker);
		if (registeredPickers.size === 0) unbindGlobalListeners();
	}
	//#endregion
	//#region src/core/thekdatepicker.ts
	var ThekDatePicker = class {
		input;
		options;
		inputWrapEl = null;
		triggerButtonEl = null;
		suspiciousIndicatorEl = null;
		revertIndicatorEl = null;
		statusTextEl = null;
		pickerEl;
		monthLabelEl;
		weekdaysEl;
		daysEl;
		dayCellEls = [];
		hourInputEl = null;
		minuteInputEl = null;
		focusedDayTs = null;
		openFocusFrame = null;
		viewportFrame = null;
		localizedMonthNames;
		localizedWeekdayNames;
		selectedDate = null;
		viewDate = /* @__PURE__ */ new Date();
		openState = false;
		isEmittingChange = false;
		destroyed = false;
		themeObserver = null;
		themeMediaQuery = null;
		handleInputClick = () => {
			if (this.options.disabled) return;
			if (this.options.openOnInputClick) this.open();
		};
		handleTriggerClick = () => {
			if (this.options.disabled) return;
			this.toggle();
		};
		handleInputBlur = (event) => {
			const nextTarget = event.relatedTarget;
			const active = document.activeElement;
			if (nextTarget && (this.pickerEl.contains(nextTarget) || this.input === nextTarget || this.inputWrapEl?.contains(nextTarget)) || active && (this.pickerEl.contains(active) || this.input === active || this.inputWrapEl?.contains(active))) return;
			this.commitInput();
		};
		handleInput = () => {
			this.applyMaskedInputWithCaret();
		};
		handleInputKeyDown = (event) => {
			if (this.options.disabled) return;
			if (event.key === "Escape") {
				this.close();
				return;
			}
			if (event.key === "Enter") {
				this.commitInput();
				this.close();
				return;
			}
			if (event.key === "ArrowDown" && event.altKey) {
				event.preventDefault();
				this.open();
				return;
			}
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			if (event.key.length !== 1) return;
			const separators = new Set(getAllowedInputSeparators(this.options));
			if (isAllowedInputKey(event.key, fullFormat(this.options), [...separators])) return;
			event.preventDefault();
		};
		handlePaste = (event) => {
			if (this.options.disabled) {
				event.preventDefault();
				return;
			}
			const text = event.clipboardData?.getData("text") ?? "";
			if (!text) return;
			if (extractInput(text, this.options)) return;
			event.preventDefault();
		};
		onGlobalPointerDown = (event) => {
			if (!this.openState) return;
			if (!event.target) return;
			const path = event.composedPath();
			if (path.includes(this.pickerEl) || path.includes(this.input) || this.inputWrapEl != null && path.includes(this.inputWrapEl) || this.triggerButtonEl != null && path.includes(this.triggerButtonEl)) return;
			this.close();
			this.commitInput();
		};
		onGlobalViewportChange = () => {
			if (!this.openState || this.viewportFrame != null) return;
			this.viewportFrame = window.requestAnimationFrame(() => {
				this.viewportFrame = null;
				if (this.openState) this.positionPicker();
			});
		};
		handleThemeMediaChange = () => {
			if (this.options.reactiveTheme && this.options.themeMode === "auto") this.applyAutoTheme();
		};
		handlePickerKeyDown = (event) => {
			if (!this.openState || this.options.disabled) return;
			switch (event.key) {
				case "Escape":
					event.preventDefault();
					this.close();
					this.input.focus();
					return;
				case "ArrowLeft":
					event.preventDefault();
					this.moveFocusedDay(-1);
					return;
				case "ArrowRight":
					event.preventDefault();
					this.moveFocusedDay(1);
					return;
				case "ArrowUp":
					event.preventDefault();
					this.moveFocusedDay(-7);
					return;
				case "ArrowDown":
					event.preventDefault();
					this.moveFocusedDay(7);
					return;
				case "Home":
					event.preventDefault();
					this.moveFocusToWeekBoundary(false);
					return;
				case "End":
					event.preventDefault();
					this.moveFocusToWeekBoundary(true);
					return;
				case "PageUp":
					event.preventDefault();
					this.moveFocusedMonth(event.shiftKey ? -12 : -1);
					return;
				case "PageDown":
					event.preventDefault();
					this.moveFocusedMonth(event.shiftKey ? 12 : 1);
					return;
				case "Enter":
				case " ":
					if (this.focusedDayTs == null) return;
					event.preventDefault();
					this.selectFocusedDay();
					return;
				default: return;
			}
		};
		handlePickerClick = (event) => {
			const target = event.target;
			if (!target) return;
			const actionEl = target.closest("[data-action]");
			if (!actionEl) return;
			const action = actionEl.dataset.action;
			if (!action) return;
			switch (action) {
				case "prev-year":
					this.moveFocusedMonth(-12);
					return;
				case "next-year":
					this.moveFocusedMonth(12);
					return;
				case "prev-month":
					this.moveFocusedMonth(-1);
					return;
				case "next-month":
					this.moveFocusedMonth(1);
					return;
				case "today": {
					const now = clampDate(/* @__PURE__ */ new Date(), this.options.minDate, this.options.maxDate);
					this.setDate(now, true);
					if (!this.options.enableTime) this.close();
					return;
				}
				case "ok":
					this.close();
					return;
				case "day": {
					const ts = Number(actionEl.dataset.ts);
					if (Number.isNaN(ts)) return;
					const raw = new Date(ts);
					if (!isValidDate(raw)) return;
					const next = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), this.selectedDate?.getHours() ?? 0, this.selectedDate?.getMinutes() ?? 0, 0, 0);
					this.setDate(next, true);
					if (this.options.closeOnSelect && !this.options.enableTime) this.close();
					return;
				}
				default: return;
			}
		};
		handleTimeChange = () => {
			if (!this.options.enableTime) return;
			const hour = this.hourInputEl ? Number(this.hourInputEl.value) : 0;
			const minute = this.minuteInputEl ? Number(this.minuteInputEl.value) : 0;
			if (Number.isNaN(hour) || Number.isNaN(minute)) return;
			const base = this.selectedDate ? new Date(this.selectedDate) : /* @__PURE__ */ new Date();
			base.setHours(Math.max(0, Math.min(23, hour)), Math.max(0, Math.min(59, minute)), 0, 0);
			this.setDate(base, true);
		};
		constructor(target, options = {}) {
			const input = typeof target === "string" ? document.querySelector(target) : target;
			if (!input) throw new Error("ThekDatePicker: target input element not found.");
			if (!(input instanceof HTMLInputElement)) throw new Error("ThekDatePicker: target must be an HTMLInputElement.");
			this.input = input;
			this.options = resolveOptions(options);
			this.options.appendTo ??= document.body;
			this.input.classList.add(`${this.options.cssPrefix}-input`);
			this.localizedMonthNames = getMonthNames(this.options.locale);
			this.localizedWeekdayNames = getWeekdayNames(this.options.locale);
			this.mountInputTrigger();
			this.pickerEl = createPickerPopover(this.options.cssPrefix);
			this.monthLabelEl = this.pickerEl.querySelector(`.${this.options.cssPrefix}-current-month`);
			this.weekdaysEl = this.pickerEl.querySelector(`.${this.options.cssPrefix}-weekdays`);
			this.daysEl = this.pickerEl.querySelector(`.${this.options.cssPrefix}-days`);
			this.applyThemeVars();
			this.pickerEl.addEventListener("click", this.handlePickerClick);
			this.pickerEl.addEventListener("keydown", this.handlePickerKeyDown);
			const defaultDate = this.options.defaultDate ?? this.input.value;
			const parsedDefault = extractInput(String(defaultDate ?? ""), this.options) ?? normalizeDateInput(this.options.defaultDate);
			if (parsedDefault) {
				this.selectedDate = clampDate(parsedDefault, this.options.minDate, this.options.maxDate);
				this.viewDate = new Date(this.selectedDate);
			} else this.viewDate = /* @__PURE__ */ new Date();
			this.input.placeholder = this.options.placeholder;
			this.input.disabled = this.options.disabled;
			this.input.setAttribute("inputmode", "text");
			this.input.setAttribute("autocomplete", "off");
			this.input.setAttribute("aria-haspopup", "grid");
			this.input.setAttribute("aria-expanded", "false");
			if (!this.pickerEl.id) this.pickerEl.id = `thekdp-picker-${Math.random().toString(36).slice(2, 9)}`;
			this.input.setAttribute("aria-controls", this.pickerEl.id);
			if (!this.monthLabelEl.id) this.monthLabelEl.id = `thekdp-month-${Math.random().toString(36).slice(2, 9)}`;
			this.pickerEl.setAttribute("aria-labelledby", this.monthLabelEl.id);
			this.daysEl.setAttribute("aria-labelledby", this.monthLabelEl.id);
			if (this.triggerButtonEl) this.triggerButtonEl.disabled = this.options.disabled;
			this.syncInput();
			this.setupReactiveTheme();
			this.bind();
			this.render();
		}
		open() {
			if (this.destroyed || this.openState || this.options.disabled) return;
			if (!this.pickerEl.isConnected) this.getAppendTarget().appendChild(this.pickerEl);
			this.openState = true;
			this.input.setAttribute("aria-expanded", "true");
			this.ensureFocusableDay();
			this.positionPicker();
			this.pickerEl.hidden = false;
			this.cancelPendingOpenFocus();
			this.openFocusFrame = window.requestAnimationFrame(() => {
				this.openFocusFrame = null;
				if (!this.openState) return;
				this.focusCurrentDayCell();
			});
			this.options.onOpen?.(this);
		}
		close() {
			if (this.destroyed || !this.openState) return;
			this.openState = false;
			this.input.setAttribute("aria-expanded", "false");
			this.cancelPendingOpenFocus();
			if (this.viewportFrame != null) {
				window.cancelAnimationFrame(this.viewportFrame);
				this.viewportFrame = null;
			}
			this.pickerEl.hidden = true;
			this.options.onClose?.(this);
		}
		toggle() {
			if (this.openState) this.close();
			else this.open();
		}
		setDate(value, triggerChange = true) {
			if (this.destroyed) return;
			const parsed = value instanceof Date ? normalizeDateInput(value) : typeof value === "string" ? extractInput(value, this.options) : null;
			if (!parsed) {
				this.clear(triggerChange);
				return;
			}
			this.selectedDate = clampDate(parsed, this.options.minDate, this.options.maxDate);
			this.viewDate = new Date(this.selectedDate);
			this.focusedDayTs = toLocalStartOfDay(this.selectedDate).getTime();
			this.hideRevertIndicator();
			this.syncInput();
			this.render();
			if (triggerChange) this.emitChange();
		}
		setDateFromTimestamp(timestampMs, triggerChange = true) {
			if (!Number.isFinite(timestampMs)) {
				this.clear(triggerChange);
				return;
			}
			this.setDate(new Date(timestampMs), triggerChange);
		}
		getDate() {
			return this.selectedDate ? new Date(this.selectedDate) : null;
		}
		clear(triggerChange = true) {
			this.selectedDate = null;
			this.input.value = "";
			this.viewDate = /* @__PURE__ */ new Date();
			this.focusedDayTs = toLocalStartOfDay(this.viewDate).getTime();
			this.hideRevertIndicator();
			this.updateSuspiciousState();
			this.render();
			if (triggerChange) this.emitChange();
		}
		setMinDate(value) {
			this.options.minDate = (typeof value === "string" ? extractInput(value, this.options) : null) ?? normalizeDateInput(value);
			this.revalidateSelection();
			this.render();
		}
		setMaxDate(value) {
			this.options.maxDate = (typeof value === "string" ? extractInput(value, this.options) : null) ?? normalizeDateInput(value);
			this.revalidateSelection();
			this.render();
		}
		setDisabled(disabled) {
			this.options.disabled = disabled;
			this.input.disabled = disabled;
			if (this.triggerButtonEl) this.triggerButtonEl.disabled = disabled;
			if (disabled) this.close();
		}
		setTheme(theme) {
			if (theme === "auto") {
				this.options.themeMode = "auto";
				this.applyAutoTheme();
				if (this.options.reactiveTheme) this.setupReactiveTheme();
				return;
			}
			this.teardownReactiveTheme();
			this.options.themeMode = typeof theme === "string" ? theme : "custom";
			this.options.theme = resolveThemeOption(theme);
			this.applyThemeVars();
		}
		destroy() {
			if (this.destroyed) return;
			this.destroyed = true;
			this.cancelPendingOpenFocus();
			if (this.viewportFrame != null) {
				window.cancelAnimationFrame(this.viewportFrame);
				this.viewportFrame = null;
			}
			this.hideRevertIndicator();
			this.unbind();
			this.teardownReactiveTheme();
			this.close();
			this.unmountInputTrigger();
			this.input.classList.remove(`${this.options.cssPrefix}-input`);
			this.input.classList.remove(`${this.options.cssPrefix}-input-suspicious`);
			this.input.classList.remove(`${this.options.cssPrefix}-input-reverted`);
			this.input.removeAttribute("inputmode");
			this.input.removeAttribute("autocomplete");
			this.input.removeAttribute("aria-haspopup");
			this.input.removeAttribute("aria-expanded");
			this.input.removeAttribute("aria-controls");
			this.input.removeAttribute("aria-describedby");
			this.input.removeAttribute("aria-invalid");
			this.input.removeAttribute("title");
			this.pickerEl.removeEventListener("click", this.handlePickerClick);
			this.pickerEl.removeEventListener("keydown", this.handlePickerKeyDown);
			if (this.pickerEl.isConnected) this.pickerEl.remove();
		}
		bind() {
			this.input.addEventListener("click", this.handleInputClick);
			this.input.addEventListener("input", this.handleInput);
			this.input.addEventListener("keydown", this.handleInputKeyDown);
			this.input.addEventListener("blur", this.handleInputBlur);
			this.input.addEventListener("paste", this.handlePaste);
			this.triggerButtonEl?.addEventListener("click", this.handleTriggerClick);
			registerGlobalPicker(this);
		}
		unbind() {
			this.input.removeEventListener("click", this.handleInputClick);
			this.input.removeEventListener("input", this.handleInput);
			this.input.removeEventListener("keydown", this.handleInputKeyDown);
			this.input.removeEventListener("blur", this.handleInputBlur);
			this.input.removeEventListener("paste", this.handlePaste);
			this.triggerButtonEl?.removeEventListener("click", this.handleTriggerClick);
			unregisterGlobalPicker(this);
			this.hourInputEl?.removeEventListener("change", this.handleTimeChange);
			this.minuteInputEl?.removeEventListener("change", this.handleTimeChange);
		}
		emitChange() {
			if (this.isEmittingChange) return;
			this.isEmittingChange = true;
			try {
				this.options.onChange?.(this.getDate(), this.input.value, this);
			} finally {
				this.isEmittingChange = false;
			}
		}
		mountInputTrigger() {
			if (!this.options.showCalendarButton) return;
			const parent = this.input.parentElement;
			if (!parent) return;
			const wrap = document.createElement("div");
			wrap.className = `${this.options.cssPrefix}-input-wrap`;
			parent.insertBefore(wrap, this.input);
			wrap.appendChild(this.input);
			const suspiciousIndicator = createSuspiciousIndicator(this.options.cssPrefix);
			wrap.appendChild(suspiciousIndicator);
			const revertIndicator = createRevertIndicator(this.options.cssPrefix);
			wrap.appendChild(revertIndicator);
			const statusText = createAssistiveText(this.options.cssPrefix, "status");
			wrap.appendChild(statusText);
			const button = createTriggerButton(this.options.cssPrefix);
			wrap.appendChild(button);
			this.inputWrapEl = wrap;
			this.triggerButtonEl = button;
			this.suspiciousIndicatorEl = suspiciousIndicator;
			this.revertIndicatorEl = revertIndicator;
			this.statusTextEl = statusText;
		}
		unmountInputTrigger() {
			if (!this.inputWrapEl) return;
			const parent = this.inputWrapEl.parentElement;
			if (!parent) return;
			parent.insertBefore(this.input, this.inputWrapEl);
			this.inputWrapEl.remove();
			this.inputWrapEl = null;
			this.triggerButtonEl = null;
			this.suspiciousIndicatorEl = null;
			this.revertIndicatorEl = null;
			this.statusTextEl = null;
		}
		applyMaskedInputWithCaret() {
			applyMaskedInputWithCaret(this.input, fullFormat(this.options));
		}
		setupReactiveTheme() {
			this.teardownReactiveTheme();
			if (!this.options.reactiveTheme || this.options.themeMode !== "auto") return;
			this.themeObserver = new MutationObserver(() => {
				this.applyAutoTheme();
			});
			this.themeObserver.observe(document.documentElement, {
				attributes: true,
				attributeFilter: [this.options.themeAttribute]
			});
			if (window.matchMedia) {
				this.themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
				this.themeMediaQuery.addEventListener("change", this.handleThemeMediaChange);
			}
			this.applyAutoTheme();
		}
		teardownReactiveTheme() {
			this.themeObserver?.disconnect();
			this.themeObserver = null;
			if (this.themeMediaQuery) this.themeMediaQuery.removeEventListener("change", this.handleThemeMediaChange);
			this.themeMediaQuery = null;
		}
		showRevertIndicator(rejectedInput) {
			if (!this.options.revertWarning) return;
			const detail = `${this.options.revertMessage} : ${rejectedInput}`;
			this.input.classList.add(`${this.options.cssPrefix}-input-reverted`);
			this.input.title = detail;
			if (this.inputWrapEl) this.inputWrapEl.classList.add(`${this.options.cssPrefix}-input-wrap-reverted`);
			if (this.revertIndicatorEl) {
				this.revertIndicatorEl.hidden = false;
				this.revertIndicatorEl.title = detail;
			}
			this.syncStatusDescription(detail);
		}
		hideRevertIndicator() {
			this.input.classList.remove(`${this.options.cssPrefix}-input-reverted`);
			if (this.inputWrapEl) this.inputWrapEl.classList.remove(`${this.options.cssPrefix}-input-wrap-reverted`);
			if (this.revertIndicatorEl) {
				this.revertIndicatorEl.hidden = true;
				this.revertIndicatorEl.title = "";
			}
			if (!this.input.classList.contains(`${this.options.cssPrefix}-input-suspicious`)) this.input.removeAttribute("title");
			this.syncStatusDescription();
		}
		applyAutoTheme() {
			const template = resolveAutoThemeTemplate(this.options.themeAttribute);
			this.options.theme = resolveThemeOption(template);
			this.applyThemeVars();
		}
		getThemeTargets() {
			const targets = [this.input, this.pickerEl];
			if (this.inputWrapEl) targets.push(this.inputWrapEl);
			if (this.triggerButtonEl) targets.push(this.triggerButtonEl);
			return targets;
		}
		applyThemeVars() {
			applyThemeVars(this.options.theme, this.getThemeTargets());
		}
		setTimeInputs(hourInputEl, minuteInputEl) {
			if (this.hourInputEl && this.hourInputEl !== hourInputEl) this.hourInputEl.removeEventListener("change", this.handleTimeChange);
			if (this.minuteInputEl && this.minuteInputEl !== minuteInputEl) this.minuteInputEl.removeEventListener("change", this.handleTimeChange);
			if (hourInputEl && this.hourInputEl !== hourInputEl) hourInputEl.addEventListener("change", this.handleTimeChange);
			if (minuteInputEl && this.minuteInputEl !== minuteInputEl) minuteInputEl.addEventListener("change", this.handleTimeChange);
			this.hourInputEl = hourInputEl;
			this.minuteInputEl = minuteInputEl;
		}
		getAppendTarget() {
			return this.options.appendTo ?? document.body;
		}
		isDateDisabled(date) {
			const value = toLocalStartOfDay(date);
			if (this.options.minDate && value < toLocalStartOfDay(this.options.minDate)) return true;
			if (this.options.maxDate && value > toLocalStartOfDay(this.options.maxDate)) return true;
			return false;
		}
		getDefaultFocusedDay() {
			return getDefaultFocusedDay(this.selectedDate, this.options.minDate, this.options.maxDate, (date) => this.isDateDisabled(date));
		}
		ensureFocusableDay() {
			if (this.focusedDayTs == null) this.focusedDayTs = this.getDefaultFocusedDay().getTime();
		}
		focusCurrentDayCell() {
			const targetTs = this.focusedDayTs;
			if (targetTs == null) return;
			this.dayCellEls.find((item) => item.dataset.ts === String(targetTs) && !item.disabled)?.focus();
		}
		cancelPendingOpenFocus() {
			if (this.openFocusFrame == null) return;
			window.cancelAnimationFrame(this.openFocusFrame);
			this.openFocusFrame = null;
		}
		moveFocusedDay(deltaDays) {
			this.ensureFocusableDay();
			this.cancelPendingOpenFocus();
			const base = moveFocusedDay(this.focusedDayTs ?? this.getDefaultFocusedDay().getTime(), deltaDays);
			if (this.isDateDisabled(base)) return;
			this.focusedDayTs = toLocalStartOfDay(base).getTime();
			this.viewDate = new Date(base);
			this.render();
			this.focusCurrentDayCell();
		}
		moveFocusToWeekBoundary(toEnd) {
			this.ensureFocusableDay();
			this.cancelPendingOpenFocus();
			const base = moveFocusToWeekBoundary(this.focusedDayTs ?? this.getDefaultFocusedDay().getTime(), this.options.weekStartsOn, toEnd);
			if (this.isDateDisabled(base)) return;
			this.focusedDayTs = toLocalStartOfDay(base).getTime();
			this.viewDate = new Date(base);
			this.render();
			this.focusCurrentDayCell();
		}
		moveFocusedMonth(deltaMonths) {
			this.ensureFocusableDay();
			this.cancelPendingOpenFocus();
			const base = moveFocusedMonth(this.focusedDayTs ?? this.getDefaultFocusedDay().getTime(), deltaMonths);
			if (this.isDateDisabled(base)) return;
			this.focusedDayTs = toLocalStartOfDay(base).getTime();
			this.viewDate = new Date(base);
			this.render();
			this.focusCurrentDayCell();
		}
		selectFocusedDay() {
			const focusedTs = this.focusedDayTs;
			if (focusedTs == null) return;
			const raw = new Date(focusedTs);
			if (!isValidDate(raw) || this.isDateDisabled(raw)) return;
			const next = new Date(raw.getFullYear(), raw.getMonth(), raw.getDate(), this.selectedDate?.getHours() ?? 0, this.selectedDate?.getMinutes() ?? 0, 0, 0);
			this.setDate(next, true);
			if (this.options.closeOnSelect && !this.options.enableTime) {
				this.close();
				this.input.focus();
			}
		}
		measurePickerRect() {
			const wasHidden = this.pickerEl.hidden;
			const prevVisibility = this.pickerEl.style.visibility;
			const prevPointerEvents = this.pickerEl.style.pointerEvents;
			if (wasHidden) {
				this.pickerEl.hidden = false;
				this.pickerEl.style.visibility = "hidden";
				this.pickerEl.style.pointerEvents = "none";
			}
			const rect = this.pickerEl.getBoundingClientRect();
			if (wasHidden) {
				this.pickerEl.hidden = true;
				this.pickerEl.style.visibility = prevVisibility;
				this.pickerEl.style.pointerEvents = prevPointerEvents;
			}
			return rect;
		}
		positionPicker() {
			const inputRect = this.input.getBoundingClientRect();
			const pickerRect = this.measurePickerRect();
			const appendTo = this.getAppendTarget();
			const isBodyMount = appendTo === document.body;
			const containerRect = isBodyMount ? null : appendTo.getBoundingClientRect();
			const scrollLeft = isBodyMount ? window.scrollX : appendTo.scrollLeft;
			const scrollTop = isBodyMount ? window.scrollY : appendTo.scrollTop;
			const viewportPadding = 8;
			const offset = 6;
			const containerWidth = isBodyMount ? document.documentElement.clientWidth : appendTo.clientWidth;
			const containerHeight = isBodyMount ? document.documentElement.clientHeight : appendTo.clientHeight;
			const pickerWidth = Math.max(pickerRect.width, this.pickerEl.offsetWidth, 0);
			const pickerHeight = Math.max(pickerRect.height, this.pickerEl.offsetHeight, 0);
			const localTop = inputRect.top - (containerRect?.top ?? 0) + scrollTop;
			const localBottom = inputRect.bottom - (containerRect?.top ?? 0) + scrollTop;
			const localLeft = inputRect.left - (containerRect?.left ?? 0) + scrollLeft;
			const availableAbove = isBodyMount ? inputRect.top : inputRect.top - (containerRect?.top ?? 0);
			const availableBelow = isBodyMount ? document.documentElement.clientHeight - inputRect.bottom : (containerRect?.bottom ?? 0) - inputRect.bottom;
			const preferredTop = localBottom + offset;
			const flippedTop = localTop - pickerHeight - offset;
			const minTop = scrollTop + viewportPadding;
			const maxTop = scrollTop + Math.max(viewportPadding, containerHeight - pickerHeight - viewportPadding);
			const shouldFlip = pickerHeight > 0 && availableBelow < pickerHeight + offset && availableAbove > availableBelow;
			const top = Math.min(maxTop, Math.max(minTop, shouldFlip ? flippedTop : preferredTop));
			const minLeft = scrollLeft + viewportPadding;
			const maxLeft = scrollLeft + Math.max(viewportPadding, containerWidth - pickerWidth - viewportPadding);
			const left = Math.min(maxLeft, Math.max(minLeft, localLeft));
			this.pickerEl.style.position = "absolute";
			this.pickerEl.style.top = `${top}px`;
			this.pickerEl.style.left = `${left}px`;
			this.pickerEl.style.zIndex = String(this.options.zIndex);
		}
		ensureDayCells() {
			this.dayCellEls = ensureDayCells(this.daysEl, this.options.cssPrefix);
		}
		commitInput() {
			if (this.options.disabled) return;
			const raw = this.input.value.trim();
			if (!raw) {
				this.clear(true);
				return;
			}
			const parsed = extractInput(raw, this.options);
			if (!parsed) {
				this.syncInput();
				this.showRevertIndicator(raw);
				return;
			}
			this.hideRevertIndicator();
			const clamped = clampDate(parsed, this.options.minDate, this.options.maxDate);
			if (clamped.getTime() !== parsed.getTime()) {
				this.selectedDate = clamped;
				this.viewDate = new Date(clamped);
				this.focusedDayTs = toLocalStartOfDay(clamped).getTime();
				this.input.value = formatDate(clamped, fullFormat(this.options));
				this.updateSuspiciousState();
				this.render();
				this.showRevertIndicator(raw);
				this.emitChange();
			} else this.setDate(clamped, true);
		}
		syncInput() {
			if (!this.selectedDate) {
				this.input.value = "";
				this.updateSuspiciousState();
				return;
			}
			this.input.value = formatDate(this.selectedDate, fullFormat(this.options));
			this.updateSuspiciousState();
		}
		updateSuspiciousState() {
			const suspicious = this.selectedDate ? isSuspiciousDate(this.selectedDate, this.options) : false;
			this.input.classList.toggle(`${this.options.cssPrefix}-input-suspicious`, suspicious);
			this.input.toggleAttribute("aria-invalid", suspicious);
			if (this.inputWrapEl) this.inputWrapEl.classList.toggle(`${this.options.cssPrefix}-input-wrap-suspicious`, suspicious);
			if (this.suspiciousIndicatorEl) {
				this.suspiciousIndicatorEl.hidden = !suspicious;
				this.suspiciousIndicatorEl.title = suspicious ? this.options.suspiciousMessage : "";
			}
			if (suspicious) this.input.title = this.options.suspiciousMessage;
			else this.input.removeAttribute("title");
			this.syncStatusDescription();
		}
		syncStatusDescription(overrideMessage) {
			const messages = /* @__PURE__ */ new Set();
			if (overrideMessage) messages.add(overrideMessage);
			else if (this.revertIndicatorEl && !this.revertIndicatorEl.hidden && this.revertIndicatorEl.title) messages.add(this.revertIndicatorEl.title);
			if (this.suspiciousIndicatorEl && !this.suspiciousIndicatorEl.hidden && this.options.suspiciousMessage) messages.add(this.options.suspiciousMessage);
			if (!this.statusTextEl) return;
			const text = [...messages].join(" ");
			this.statusTextEl.textContent = text;
			if (text) this.input.setAttribute("aria-describedby", this.statusTextEl.id);
			else this.input.removeAttribute("aria-describedby");
		}
		revalidateSelection() {
			if (!this.selectedDate) return;
			this.selectedDate = clampDate(this.selectedDate, this.options.minDate, this.options.maxDate);
			this.syncInput();
		}
		render() {
			const year = this.viewDate.getFullYear();
			const month = this.viewDate.getMonth();
			this.ensureFocusableDay();
			this.monthLabelEl.textContent = resolveMonthLabel(this.localizedMonthNames, month, year, this.options.locale);
			this.pickerEl.setAttribute("aria-label", `${this.localizedMonthNames[month] ?? ""} ${year}`.trim());
			renderWeekdays(this.weekdaysEl, this.localizedWeekdayNames, this.options.weekStartsOn, rotateWeekdayLabels, this.options.cssPrefix);
			this.ensureDayCells();
			renderDayGrid({
				dayCellEls: this.dayCellEls,
				viewDate: this.viewDate,
				selectedDate: this.selectedDate,
				focusedDayTs: this.focusedDayTs,
				locale: this.options.locale,
				weekStartsOn: this.options.weekStartsOn,
				cssPrefix: this.options.cssPrefix,
				isDateDisabled: (date) => this.isDateDisabled(date)
			});
			const timeContainer = this.pickerEl.querySelector(`.${this.options.cssPrefix}-time`);
			const actions = this.pickerEl.querySelector(`.${this.options.cssPrefix}-actions`);
			if (this.options.enableTime) {
				const selectedDate = this.selectedDate ?? /* @__PURE__ */ new Date();
				const inputs = ensureTimeInputs(timeContainer, actions, this.options.cssPrefix);
				this.setTimeInputs(inputs.hourInputEl, inputs.minuteInputEl);
				syncTimeInputs(this.hourInputEl, this.minuteInputEl, selectedDate);
			} else hideTimeInputs(timeContainer, actions, this.options.cssPrefix);
		}
	};
	function createDatePicker(target, options) {
		return new ThekDatePicker(target, options);
	}
	//#endregion
	exports.ThekDatePicker = ThekDatePicker;
	exports.applyMaskToInput = applyMaskToInput;
	exports.createDatePicker = createDatePicker;
	exports.formatDate = formatDate;
	exports.getGlobalOptions = getGlobalOptions;
	exports.parseDateByFormat = parseDateByFormat;
	exports.resetGlobalOptions = resetGlobalOptions;
	exports.setGlobalOptions = setGlobalOptions;
});
