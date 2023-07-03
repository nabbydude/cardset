export interface cardFrame {
	image: string;
}

export const colorNamesByLetter = {
	W: "white",
	U: "blue",
	B: "black",
	R: "red",
	G: "green",
	C: "colorless",
} as const;

export const frameUrls = {
	white: (new URL("/assets/card/white.jpg", import.meta.url)).toString(),
	blue: (new URL("/assets/card/blue.jpg", import.meta.url)).toString(),
	black: (new URL("/assets/card/black.jpg", import.meta.url)).toString(),
	red: (new URL("/assets/card/red.jpg", import.meta.url)).toString(),
	green: (new URL("/assets/card/green.jpg", import.meta.url)).toString(),
};

export const iconUrls = {
	white: (new URL("/assets/mana/white.svg", import.meta.url)).toString(),
	blue: (new URL("/assets/mana/blue.svg", import.meta.url)).toString(),
	black: (new URL("/assets/mana/black.svg", import.meta.url)).toString(),
	red: (new URL("/assets/mana/red.svg", import.meta.url)).toString(),
	green: (new URL("/assets/mana/green.svg", import.meta.url)).toString(),
	colorless: (new URL("/assets/mana/colorless.svg", import.meta.url)).toString(),
};
