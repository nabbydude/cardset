import React, { CSSProperties, ChangeEvent, useCallback, useMemo, useState } from "react";
import { firstMatchingEntry } from "../slate";
import { TextField } from "./TextField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { Card } from "./slate/Card";
import { useDocumentWithV } from "./contexts/DocumentContext";
import { ImageField } from "./ImageField";
import { ManaTextField } from "./ManaTextField";
import { Button, NonIdealState } from "@blueprintjs/core";
import { addNewCardToDoc } from "./App";

export interface CardEditorProps {
	cardId: number | undefined;
}

export function CardEditor(props: CardEditorProps) {
	const { cardId } = props;
	const { doc, v } = useDocumentWithV();
	const cardEntry = useMemo(() => firstMatchingEntry<Card>(doc, { type: "Card", id: cardId }) ?? [undefined, undefined] as const, [doc, v, cardId]);
	const [card, path] = cardEntry;
	const [scaledInch, setScaledInch] = useState(150);

	const scaleCb = useCallback((e: ChangeEvent<HTMLInputElement>) => setScaledInch(Number(e.target.value)), [setScaledInch]);
	const createCard = useCallback(() => addNewCardToDoc(doc), [doc]);

	let editor;
	if (card) {
		editor = (
			<div className="card-editor" style={{ "--in": `${scaledInch}px` } as CSSProperties}>
				<CardFrame cardEntry={cardEntry} field={"frame"}/>
				<div className="title-bar name-line">
					<TextField cardPath={path} field={"name"} minFontSize={5} maxFontSize={10.5}/>
					<ManaTextField cardPath={path} field={"cost"} minFontSize={4} maxFontSize={9}/>
				</div>

				<ImageField cardPath={path} field={"image"}/>
				<div className="title-bar type-line">
					<TextField cardPath={path} field={"type"} minFontSize={4} maxFontSize={8.5}/>

					<div className="set-symbol"></div>
				</div>
				<TextField cardPath={path} field={"cardText"} minFontSize={4} maxFontSize={9}/>
				<PowerToughnessBackground cardEntry={cardEntry} field={"pt_box"} checkField={"pt"}/>
				<TextField cardPath={path} field={"pt"} minFontSize={5} maxFontSize={10.5}/>
			</div>
		);
	} else {
		editor = (
			<NonIdealState
				className="card-editor"
				title="No Card Focused"
				description="Select a card from the list on the right or create a new one."
				action={<Button icon="plus" onClick={createCard}>Create a card</Button>}
			/>
		);
	}

	return (
		<div className="card-editor-wrapper">
			<div style={{ display: "grid", gridTemplateColumns: "6ch 1fr", width: "180px" }}>
				<input type="number" min="75" max="300" step="1" value={scaledInch} onChange={scaleCb}/>
				<input type="range" min="75" max="300" step="1" value={scaledInch} onChange={scaleCb}/>
			</div>
			{editor}
		</div>
	);
}
