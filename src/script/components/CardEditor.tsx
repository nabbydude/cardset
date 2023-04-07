import React, { KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Descendant } from "slate";
import { Editable, Slate } from "slate-react";
import { card } from "../card";
import { MultiEditor } from "../multi_slate";
import { create_card_editor, create_card_field_editor, CustomEditor, find_path_to_field, renderElement, renderLeaf } from "../slate";
import { CardField } from "./CardField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBox } from "./PowerToughnessBox";
import { Card } from "./slate/Card";

export interface CardEditorProps {
	card: card;
}

export function CardEditor(props: CardEditorProps) {
	const { card } = props;
	const { markup } = card;

	const [editor] = useState(() => create_card_editor(markup));
	useEffect(() => { (window as any).editor = editor; });
	return (
		<Slate editor={editor} value={editor.children}>
			<div className="card_editor">
				<CardFrame frame={card.frame}/>
				<div className="name_line">
					<CardField card={card} cardEditor={editor} field={"name"}/>
					<CardField card={card} cardEditor={editor} field={"cost"}/>
				</div>

				<div className="type_line">
					<CardField card={card} cardEditor={editor} field={"type"}/>

					<div className="set_symbol"></div>
				</div>
				<div className="text_box">
					<CardField card={card} cardEditor={editor} field={"rules_text"}/>
					<div className="visual_box"></div>
					<hr className="flavor_bar"/>
					<CardField card={card} cardEditor={editor} field={"flavor_text"}/>
					<div className="visual_box"></div>
				</div>
				<PowerToughnessBox card={card} cardEditor={editor} field={"pt"}/>
			</div>
		</Slate>
	);
}
