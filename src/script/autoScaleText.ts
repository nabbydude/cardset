export function asScalingIn(n: number): string {
	return `calc(${n} * var(--in))`;
}

export function asScalingPt(n: number): string {
	return `calc(${n} * var(--pt))`;
}

export function asEm(n: number): string {
	return `${n}em`;
}

export function getFillSize(el: HTMLElement, minFontSize: number, maxFontSize: number, step: number = 1, asUnit: (n: number) => string = asScalingPt) {
	let size = maxFontSize;

	const old = el.style.fontSize;
	el.style.fontSize = asUnit(size);
	while (size > minFontSize && (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight)) {
		size -= step;
		el.style.fontSize = asUnit(size); // this re-layouts every time
	}
	el.style.fontSize = old;
	return size;
}
