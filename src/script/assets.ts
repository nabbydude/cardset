import { dumb_load_image_from_url } from "./image";

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

export const frame_images = {
	white:        dumb_load_image_from_url((new URL("/assets/card/white.jpg"       , import.meta.url)).toString()),
	blue:         dumb_load_image_from_url((new URL("/assets/card/blue.jpg"        , import.meta.url)).toString()),
	black:        dumb_load_image_from_url((new URL("/assets/card/black.jpg"       , import.meta.url)).toString()),
	red:          dumb_load_image_from_url((new URL("/assets/card/red.jpg"         , import.meta.url)).toString()),
	green:        dumb_load_image_from_url((new URL("/assets/card/green.jpg"       , import.meta.url)).toString()),
	multicolored: dumb_load_image_from_url((new URL("/assets/card/multicolored.jpg", import.meta.url)).toString()),
	colorless:    dumb_load_image_from_url((new URL("/assets/card/colorless.jpg"   , import.meta.url)).toString()),
	artifact:     dumb_load_image_from_url((new URL("/assets/card/artifact.jpg"    , import.meta.url)).toString()),
	land:         dumb_load_image_from_url((new URL("/assets/card/land.jpg"        , import.meta.url)).toString()),
};

export const pt_box_images = {
	white:        dumb_load_image_from_url((new URL("/assets/pt/white.png"       , import.meta.url)).toString()),
	blue:         dumb_load_image_from_url((new URL("/assets/pt/blue.png"        , import.meta.url)).toString()),
	black:        dumb_load_image_from_url((new URL("/assets/pt/black.png"       , import.meta.url)).toString()),
	red:          dumb_load_image_from_url((new URL("/assets/pt/red.png"         , import.meta.url)).toString()),
	green:        dumb_load_image_from_url((new URL("/assets/pt/green.png"       , import.meta.url)).toString()),
	multicolored: dumb_load_image_from_url((new URL("/assets/pt/multicolored.png", import.meta.url)).toString()),
	colorless:    dumb_load_image_from_url((new URL("/assets/pt/colorless.png"   , import.meta.url)).toString()),
	artifact:     dumb_load_image_from_url((new URL("/assets/pt/artifact.png"    , import.meta.url)).toString()),
};

export const iconUrls = {
	white:     (new URL("/assets/icons/white.svg"    , import.meta.url)).toString(),
	blue:      (new URL("/assets/icons/blue.svg"     , import.meta.url)).toString(),
	black:     (new URL("/assets/icons/black.svg"    , import.meta.url)).toString(),
	red:       (new URL("/assets/icons/red.svg"      , import.meta.url)).toString(),
	green:     (new URL("/assets/icons/green.svg"    , import.meta.url)).toString(),
	colorless: (new URL("/assets/icons/colorless.svg", import.meta.url)).toString(),
	tap:       (new URL("/assets/icons/tap.svg"      , import.meta.url)).toString(),
};
