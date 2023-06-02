import React, { useMemo } from "react";
import { first_matching_element, first_matching_entry, to_plaintext } from "../slate";
import { TextField } from "./TextField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { Card } from "./slate/Card";
import { useDocumentWithV } from "./contexts/DocumentContext";
import { ImageField } from "./ImageField";

export interface CardEditorProps {
	card_id: number;
}

export function CardEditor(props: CardEditorProps) {
	const { card_id } = props;
	const { doc, v } = useDocumentWithV();
	const [card, path] = useMemo(() => first_matching_entry<Card>(doc, { type: "Card", id: card_id }) ?? [undefined, undefined], [doc, v, card_id]);
	if (!card) return (<div className="card_editor empty">No card focused</div>);

	const frame_field = first_matching_element(card, { type: "Field", name: "frame" });
	const frame_value = frame_field ? to_plaintext(frame_field.children) : "none";
	return (
		<div className="card_editor">
			<CardFrame frame={{ image: frame_value }}/>
			<div className="name_line">
				<TextField card_path={path} field={"name"} min_font_size={8} max_font_size={16}/>
				<TextField card_path={path} field={"cost"} min_font_size={7} max_font_size={15}/>
			</div>

			<ImageField card_path={path} field={"image"}/>
			<div className="type_line">
				<TextField card_path={path} field={"type"} min_font_size={5} max_font_size={13}/>

				<div className="set_symbol"></div>
			</div>
			<TextField card_path={path} field={"card_text"} min_font_size={6} max_font_size={14}/>
			<PowerToughnessBackground card_path={path} field={"pt"}/>
			<TextField card_path={path} field={"pt"} min_font_size={8} max_font_size={16}/>
		</div>
	);
}
