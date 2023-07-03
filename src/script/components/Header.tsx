import React from "react";
import { Toolbar } from "./Toolbar";

export interface HeaderProps {
	saveActiveCardImage: () => void,
	saveSet: () => void,
	loadSet: () => void,
}


export function Header(props: HeaderProps) {
	const { saveActiveCardImage, saveSet, loadSet } = props;
	return (
		<div id="header">
			<h1>Cardset</h1>
			<Toolbar
				saveActiveCardImage={saveActiveCardImage}
				saveSet={saveSet}
				loadSet={loadSet}
			/>
		</div>
	);
}
