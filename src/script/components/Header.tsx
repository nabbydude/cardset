import React from "react";
import { Toolbar } from "./Toolbar";

export interface HeaderProps {
	saveActiveCardImage: () => void,
}


export function Header(props: HeaderProps) {
	const { saveActiveCardImage } = props;	return (
		<div id="header">
			<h1>Cardset</h1>
			<Toolbar saveActiveCardImage={saveActiveCardImage}/>
		</div>
	);
}
