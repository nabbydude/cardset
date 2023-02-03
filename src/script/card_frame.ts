export interface card_frame {
	image: string;
}

export const frame_urls = {
	white: (new URL("/assets/card/white.jpg", import.meta.url)).toString(),
	blue: (new URL("/assets/card/blue.jpg", import.meta.url)).toString(),
	black: (new URL("/assets/card/black.jpg", import.meta.url)).toString(),
	red: (new URL("/assets/card/red.jpg", import.meta.url)).toString(),
	green: (new URL("/assets/card/green.jpg", import.meta.url)).toString(),
}
