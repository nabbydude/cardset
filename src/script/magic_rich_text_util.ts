export function create_mana_symbol(text: string): HTMLSpanElement {
	const symbol = document.createElement("span");
	symbol.contentEditable = "false";
	symbol.classList.add("mana");
	switch (text) {
		case "W": case "w": symbol.classList.add("white"); break;
		case "U": case "u": symbol.classList.add("blue"); break;
		case "B": case "b": symbol.classList.add("black"); break;
		case "R": case "r": symbol.classList.add("red"); break;
		case "G": case "g": symbol.classList.add("green"); break;

		default: symbol.classList.add("generic");
	}

	symbol.textContent = text;
	return symbol;
}
