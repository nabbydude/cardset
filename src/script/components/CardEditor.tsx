import React, { CSSProperties, ChangeEvent, useCallback, useMemo, useState } from "react";
import { first_matching_element, first_matching_entry, to_plaintext } from "../slate";
import { TextField } from "./TextField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { Card } from "./slate/Card";
import { useDocumentWithV } from "./contexts/DocumentContext";
import { ImageField } from "./ImageField";
import { ManaTextField } from "./ManaTextField";

export interface CardEditorProps {
	card_id: number;
}

export function CardEditor(props: CardEditorProps) {
	const { card_id } = props;
	const { doc, v } = useDocumentWithV();
	const [card, path] = useMemo(() => first_matching_entry<Card>(doc, { type: "Card", id: card_id }) ?? [undefined, undefined], [doc, v, card_id]);
	const [scaled_inch, set_scaled_inch] = useState(150);
	const scale_cb = useCallback((e: ChangeEvent<HTMLInputElement>) => set_scaled_inch(Number(e.target.value)), [set_scaled_inch]);

	let editor;
	if (card) {
		const frame_field = first_matching_element(card, { type: "Field", name: "frame" });
		const frame_value = frame_field ? to_plaintext(frame_field.children) : "none";
		editor = (
			<div className="card_editor" style={{ "--in": `${scaled_inch}px` } as CSSProperties}>
				<CardFrame frame={{ image: frame_value }}/>
				<div className="title_bar name_line">
					<TextField card_path={path} field={"name"} min_font_size={5} max_font_size={10.5}/>
					<ManaTextField card_path={path} field={"cost"} min_font_size={4} max_font_size={9}/>
				</div>

				<ImageField card_path={path} field={"image"}/>
				<div className="title_bar type_line">
					<TextField card_path={path} field={"type"} min_font_size={4} max_font_size={8.5}/>

					<div className="set_symbol"></div>
				</div>
				<TextField card_path={path} field={"card_text"} min_font_size={4} max_font_size={9}/>
				<PowerToughnessBackground card_path={path} field={"pt"}/>
				<TextField card_path={path} field={"pt"} min_font_size={5} max_font_size={10.5}/>
			</div>
		);
	} else {
		editor = <div className="card_editor empty" style={{ "--in": `${scaled_inch}px` } as CSSProperties}>No card focused</div>;
	}

	return (
		<div className="card_editor_wrapper">
			<div style={{ display: "grid", gridTemplateColumns: "6ch 1fr", width: "180px" }}>
				<input type="number" min="75" max="300" step="1" value={scaled_inch} onChange={scale_cb}/>
				<input type="range" min="75" max="300" step="1" value={scaled_inch} onChange={scale_cb}/>
			</div>
			{editor}
		</div>
	);
}
