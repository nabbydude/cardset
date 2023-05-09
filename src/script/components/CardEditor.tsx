import React, { useMemo } from "react";
import { first_matching_element, first_matching_entry, to_plaintext } from "../slate";
import { CardField } from "./CardField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { Card } from "./slate/Card";
import { Editor } from "slate";
import { MultiEditor } from "../multi_slate";
import { useDocument } from "./DocumentContext";

export interface CardEditorProps {
	card_id: number;
}

export function CardEditor(props: CardEditorProps) {
	const { card_id } = props;
	const doc = useDocument();
	const [card, path] = useMemo(() => first_matching_entry<Card>(doc, { type: "Card", id: card_id }) ?? [undefined, undefined], [doc, card_id]);
	if (!card) return (<div>No card focused</div>);

	const frame_field = first_matching_element(card, { type: "Field", name: "frame" });
	const frame_value = frame_field ? to_plaintext(frame_field.children) : "none";
	return (
		<div className="card_editor">
			<CardFrame frame={{ image: frame_value }}/>
			<div className="name_line">
				<CardField card_path={path} field={"name"}/>
				<CardField card_path={path} field={"cost"}/>
			</div>

			<div className="type_line">
				<CardField card_path={path} field={"type"}/>

				<div className="set_symbol"></div>
			</div> 
			<div className="text_box">
				<CardField card_path={path} field={"rules_text"}/>
				<div className="visual_box"></div>
				<hr className="flavor_bar"/>
				<CardField card_path={path} field={"flavor_text"}/>
				<div className="visual_box"></div>
			</div>
			<PowerToughnessBackground card_path={path} field={"pt"}/>
			<CardField card_path={path} field={"pt"}/>
		</div>
	);
}
