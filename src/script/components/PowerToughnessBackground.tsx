import React from "react";
import { ptBoxUrls } from "../assets";
import { ImageEnumControl, ImageEnumControlProps, option } from "./ImageEnumControl";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PowerToughnessBackgroundProps extends Omit<ImageEnumControlProps, "options"> {
	checkPropertyId: string,
}

export function PowerToughnessBackground(props: PowerToughnessBackgroundProps) {
	// const { card, propertyId, checkPropertyId: check_property, readOnly = false } = props;

	const options: option[] = [
		{ id: "white"       , label: "White"        , image: ptBoxUrls["white"       ] },
		{ id: "blue"        , label: "Blue"         , image: ptBoxUrls["blue"        ] },
		{ id: "black"       , label: "Black"        , image: ptBoxUrls["black"       ] },
		{ id: "red"         , label: "Red"          , image: ptBoxUrls["red"         ] },
		{ id: "green"       , label: "Green"        , image: ptBoxUrls["green"       ] },
		{ id: "multicolored", label: "Multicolored" , image: ptBoxUrls["multicolored"] },
		{ id: "colorless"   , label: "Colorless"    , image: ptBoxUrls["colorless"   ] },
		{ id: "artifact"    , label: "Artifact"     , image: ptBoxUrls["artifact"    ] },
	];

	return (
		<ImageEnumControl options={options} {...props}/>
	);
}
