let last_card_id = 0
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}

export function as_scaling_in(n: number): string {
	return `calc(${n} * var(--in))`;
}

export function as_scaling_pt(n: number): string {
	return `calc(${n} * var(--pt))`;
}

export function as_em(n: number): string {
	return `${n}em`;
}

export function get_fill_size(el: HTMLElement, minFontSize: number, maxFontSize: number, step: number = 1, as_unit: (n: number) => string = as_scaling_pt) {
	// we could start with a better initial guess but the ranges tand to be enough for our use case that we don't need to
	let size = maxFontSize;

	const old = el.style.fontSize;
	el.style.fontSize = as_unit(size);
	while (size > minFontSize && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
		size -= step;
		el.style.fontSize = as_unit(size);
	}
	el.style.fontSize = old;
	return size;
}
