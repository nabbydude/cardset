import React from "react";
import { Toolbar } from "./Toolbar";

export interface HeaderProps {
	save_active_card_image: () => void,
	save_set: () => void,
	load_set: () => void,
}


export function Header(props: HeaderProps) {
	const { save_active_card_image, save_set, load_set } = props;
	return (
		<div id="header">
			<h1>Cardset</h1>
			<Toolbar
				save_active_card_image={save_active_card_image}
				save_set={save_set}
				load_set={load_set}
			/>
		</div>
	);
}
