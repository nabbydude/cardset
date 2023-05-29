let last_card_id = 0
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}

export function get_fill_size(el: HTMLElement, minFontSize: number, maxFontSize: number, step: number = 1, unit: string = "pt") {
	// we could start with a better initial guess but the range is small enough for our use case that we don't need to
	let size = maxFontSize;

	const old = el.style.fontSize;
	el.style.fontSize = `${size}${unit}`;
	while (size > minFontSize && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
		size -= step;
		el.style.fontSize = `${size}${unit}`;
	}
	el.style.fontSize = old;
	return size;
}
