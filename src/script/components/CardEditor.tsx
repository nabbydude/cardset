import React, { CSSProperties, useCallback, useMemo, useState } from "react";
import { firstMatchingEntry } from "../slate";
import { TextField } from "./TextField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { Card } from "./slate/Card";
import { useDocumentWithV } from "./contexts/DocumentContext";
import { ImageField } from "./ImageField";
import { ManaTextField } from "./ManaTextField";
import { Button, NonIdealState, Slider } from "@blueprintjs/core";
import { addNewCardToDoc } from "./App";

export interface CardEditorProps {
	cardId: number | undefined;
}

export function CardEditor(props: CardEditorProps) {
	const { cardId } = props;
	const { doc, v } = useDocumentWithV();
	const cardEntry = useMemo(() => firstMatchingEntry<Card>(doc, { type: "Card", id: cardId }), [doc, v, cardId]);
	const [dpi, setDpi] = useState(150);

	const createCard = useCallback(() => addNewCardToDoc(doc), [doc]);

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
				action={<Button icon="plus" onClick={createCard}>Create a card</Button>}
			/>
		);
	}

	return (
		<div className="card-editor-wrapper" style={{ "--in": `${dpi}px` } as CSSProperties}>
			<div style={{ display: "grid", alignItems: "center", width: "150px" }}>
				<Slider
					min={100}
					max={300}
					stepSize={25}
					labelValues={[100, 150, 300]}
					onChange={setDpi}
					value={dpi}
					showTrackFill={false}
					// handleHtmlProps={{ "aria-label": "example 1" }}
				/>
			</div>
			{editor}
		</div>
	);
}
