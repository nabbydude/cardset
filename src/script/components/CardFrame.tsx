import React from "react";
import { cardFrame } from "../colorAssets";

export interface CardFrameProps {
	frame: cardFrame;
}

export function CardFrame(props: CardFrameProps) {
	const { frame } = props;
	return (
		<img className="frame" src={frame.image}/>
	);
}
