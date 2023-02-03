import React from "react";
import { card_frame } from "../card_frame";

export interface CardFrameProps {
	frame: card_frame;
}

export function CardFrame(props: CardFrameProps) {
	const { frame } = props;
	return (
		<img className="frame" src={frame.image}/>
	);
}
