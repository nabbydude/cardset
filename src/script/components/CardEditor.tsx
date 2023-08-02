import React, { CSSProperties, useMemo } from "react";
import { firstMatchingEntry } from "../slate";
import { TextField } from "./TextField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { Card } from "./slate/Card";
import { useDocumentWithV } from "./contexts/DocumentContext";
import { ImageField } from "./ImageField";
import { ManaTextField } from "./ManaTextField";
import { Button, NonIdealState } from "@blueprintjs/core";

export interface CardEditorProps {
	cardId: number | undefined,
	dpi: number,
	addCard: () => void,
}

export function CardEditor(props: CardEditorProps) {
	const { cardId, dpi, addCard } = props;
	const { doc, v } = useDocumentWithV();
	const cardEntry = useMemo(() => firstMatchingEntry<Card>(doc, { type: "Card", id: cardId }), [doc, v, cardId]);

	let editor;
	if (cardEntry) {
		editor = (
			<div className="card-editor">
				<CardFrame cardEntry={cardEntry} field={"frame"}/>
				<div className="title-bar name-line">
					<TextField cardEntry={cardEntry} field={"name"} minFontSize={5} maxFontSize={10.5}/>
					<ManaTextField cardEntry={cardEntry} field={"cost"} minFontSize={4} maxFontSize={9}/>
				</div>

				<ImageField cardEntry={cardEntry} field={"image"}/>
				<div className="title-bar type-line">
					<TextField cardEntry={cardEntry} field={"type"} minFontSize={4} maxFontSize={8.5}/>

					<div className="set-symbol"></div>
				</div>
				<TextField cardEntry={cardEntry} field={"cardText"} minFontSize={4} maxFontSize={9}/>
				<PowerToughnessBackground cardEntry={cardEntry} field={"ptBox"} checkField={"pt"}/>
				<TextField cardEntry={cardEntry} field={"pt"} minFontSize={5} maxFontSize={10.5}/>
			</div>
		);
	} else {
		editor = (
			<NonIdealState
				className="card-editor"
				title="No Card Focused"
				description="Select a card from the list on the right or create a new one."
				action={<Button icon="plus" onClick={addCard}>Create a card</Button>}
			/>
		);
	}

	return (
		<div className="card-editor-wrapper" style={{ "--in": `${dpi}px` } as CSSProperties}>
			{editor}
		</div>
	);
}
