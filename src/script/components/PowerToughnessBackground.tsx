import React from "react";
import { pt_box_images } from "../assets";
import { ImageEnumControl, ImageEnumControlProps, option } from "./ImageEnumControl";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PowerToughnessBackgroundProps extends Omit<ImageEnumControlProps, "options"> {
	checkPropertyId: string,
}

export function PowerToughnessBackground(props: PowerToughnessBackgroundProps) {
	// const { card, propertyId, checkPropertyId: check_property, readOnly = false } = props;

	const options: option[] = [
		{ id: "white"       , label: "White"        , image: pt_box_images["white"       ] },
		{ id: "blue"        , label: "Blue"         , image: pt_box_images["blue"        ] },
		{ id: "black"       , label: "Black"        , image: pt_box_images["black"       ] },
		{ id: "red"         , label: "Red"          , image: pt_box_images["red"         ] },
		{ id: "green"       , label: "Green"        , image: pt_box_images["green"       ] },
		{ id: "multicolored", label: "Multicolored" , image: pt_box_images["multicolored"] },
		{ id: "colorless"   , label: "Colorless"    , image: pt_box_images["colorless"   ] },
		{ id: "artifact"    , label: "Artifact"     , image: pt_box_images["artifact"    ] },
	];

	return (
		<ImageEnumControl options={options} {...props}/>
	);
}
