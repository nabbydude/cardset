import { assets } from "./assets";
import { control } from "./control";

export const controls: Record<string, control> = {
	frame: {
		id: "frame",
		type: "image_enum",
		property_id: "frame",
		options: [
			{ id: "white"       , label: "White"        , value: assets["frame_white"       ] },
			{ id: "blue"        , label: "Blue"         , value: assets["frame_blue"        ] },
			{ id: "black"       , label: "Black"        , value: assets["frame_black"       ] },
			{ id: "red"         , label: "Red"          , value: assets["frame_red"         ] },
			{ id: "green"       , label: "Green"        , value: assets["frame_green"       ] },
			{ id: "multicolored", label: "Multicolored" , value: assets["frame_multicolored"] },
			{ id: "colorless"   , label: "Colorless"    , value: assets["frame_colorless"   ] },
			{ id: "artifact"    , label: "Artifact"     , value: assets["frame_artifact"    ] },
		],
	},

	name: { id: "name", type: "text", property_id: "name", min_font_size: 5, max_font_size: 10.5 },
	cost: { id: "cost", type: "text", property_id: "cost", min_font_size: 4, max_font_size: 9, pips_only: true },

	image: { id: "image", type: "image", property_id: "image" },

	type: { id: "type", type: "text", property_id: "type", min_font_size: 4, max_font_size: 8.5 },
	
	cardText: { id: "cardText", type: "text", property_id: "cardText", min_font_size: 4, max_font_size: 9 },
	
	ptBox: {
		id: "ptBox",
		type: "image_enum",
		property_id: "ptBox",
		options: [
			{ id: "white"       , label: "White"        , value: assets["pt_box_white"       ] },
			{ id: "blue"        , label: "Blue"         , value: assets["pt_box_blue"        ] },
			{ id: "black"       , label: "Black"        , value: assets["pt_box_black"       ] },
			{ id: "red"         , label: "Red"          , value: assets["pt_box_red"         ] },
			{ id: "green"       , label: "Green"        , value: assets["pt_box_green"       ] },
			{ id: "multicolored", label: "Multicolored" , value: assets["pt_box_multicolored"] },
			{ id: "colorless"   , label: "Colorless"    , value: assets["pt_box_colorless"   ] },
			{ id: "artifact"    , label: "Artifact"     , value: assets["pt_box_artifact"    ] },
		],
	},
	pt: { id: "pt", type: "text", property_id: "pt", min_font_size: 5, max_font_size: 10.5 },
}
