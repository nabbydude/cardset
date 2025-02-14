import React from "react";
import { assets } from "../assets";
import { ImageEnumControl, ImageEnumControlProps, option } from "./ImageEnumControl";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PowerToughnessBackgroundProps extends Omit<ImageEnumControlProps, "options"> {
	checkPropertyId: string,
}

export function PowerToughnessBackground(props: PowerToughnessBackgroundProps) {
	// const { card, propertyId, checkPropertyId: check_property, readOnly = false } = props;

	const options: option[] = [
		{ id: "white"       , label: "White"        , image: assets["pt_box_white"       ] },
		{ id: "blue"        , label: "Blue"         , image: assets["pt_box_blue"        ] },
		{ id: "black"       , label: "Black"        , image: assets["pt_box_black"       ] },
		{ id: "red"         , label: "Red"          , image: assets["pt_box_red"         ] },
		{ id: "green"       , label: "Green"        , image: assets["pt_box_green"       ] },
		{ id: "multicolored", label: "Multicolored" , image: assets["pt_box_multicolored"] },
		{ id: "colorless"   , label: "Colorless"    , image: assets["pt_box_colorless"   ] },
		{ id: "artifact"    , label: "Artifact"     , image: assets["pt_box_artifact"    ] },
	];

	return (
		<ImageEnumControl options={options} {...props}/>
	);
}
