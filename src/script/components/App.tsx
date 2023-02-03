import React from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { create_test_card } from "../card";

const card = create_test_card();

export function App() {
	return (
		<>
			<Header/>
			<div id="content">
				<CardEditor card={card}/>
			</div>
		</>
	);
}
