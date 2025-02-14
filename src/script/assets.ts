import { load_asset_image_from_url } from "./image";

export const colorNamesByLetter = {
	W: "white",
	U: "blue",
	B: "black",
	R: "red",
	G: "green",
	C: "colorless",
} as const;

export const assets = {
	frame_white:        load_asset_image_from_url("frame_white"       , (new URL("/assets/card/white.jpg"       , import.meta.url)).toString()),
	frame_blue:         load_asset_image_from_url("frame_blue"        , (new URL("/assets/card/blue.jpg"        , import.meta.url)).toString()),
	frame_black:        load_asset_image_from_url("frame_black"       , (new URL("/assets/card/black.jpg"       , import.meta.url)).toString()),
	frame_red:          load_asset_image_from_url("frame_red"         , (new URL("/assets/card/red.jpg"         , import.meta.url)).toString()),
	frame_green:        load_asset_image_from_url("frame_green"       , (new URL("/assets/card/green.jpg"       , import.meta.url)).toString()),
	frame_multicolored: load_asset_image_from_url("frame_multicolored", (new URL("/assets/card/multicolored.jpg", import.meta.url)).toString()),
	frame_colorless:    load_asset_image_from_url("frame_colorless"   , (new URL("/assets/card/colorless.jpg"   , import.meta.url)).toString()),
	frame_artifact:     load_asset_image_from_url("frame_artifact"    , (new URL("/assets/card/artifact.jpg"    , import.meta.url)).toString()),
	frame_land:         load_asset_image_from_url("frame_land"        , (new URL("/assets/card/land.jpg"        , import.meta.url)).toString()),

	pt_box_white:        load_asset_image_from_url("pt_box_white"       , (new URL("/assets/pt/white.png"       , import.meta.url)).toString()),
	pt_box_blue:         load_asset_image_from_url("pt_box_blue"        , (new URL("/assets/pt/blue.png"        , import.meta.url)).toString()),
	pt_box_black:        load_asset_image_from_url("pt_box_black"       , (new URL("/assets/pt/black.png"       , import.meta.url)).toString()),
	pt_box_red:          load_asset_image_from_url("pt_box_red"         , (new URL("/assets/pt/red.png"         , import.meta.url)).toString()),
	pt_box_green:        load_asset_image_from_url("pt_box_green"       , (new URL("/assets/pt/green.png"       , import.meta.url)).toString()),
	pt_box_multicolored: load_asset_image_from_url("pt_box_multicolored", (new URL("/assets/pt/multicolored.png", import.meta.url)).toString()),
	pt_box_colorless:    load_asset_image_from_url("pt_box_colorless"   , (new URL("/assets/pt/colorless.png"   , import.meta.url)).toString()),
	pt_box_artifact:     load_asset_image_from_url("pt_box_artifact"    , (new URL("/assets/pt/artifact.png"    , import.meta.url)).toString()),
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
