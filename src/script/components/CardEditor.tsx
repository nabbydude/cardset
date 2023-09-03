import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useContext, useMemo } from "react";
import { TextField } from "./TextField";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { useDocumentWithV } from "./contexts/DocumentContext";
import { ImageField } from "./ImageField";
import { ManaTextField } from "./ManaTextField";
import { Button, NonIdealState } from "@blueprintjs/core";
import { firstMatchingEntry } from "../slate";
import { Card, createTestCard } from "./slate/Card";
import { DpiContext } from "./contexts/DpiContext";

export interface CardEditorProps {
	cardId: number | undefined,
	setSelectedIds: Dispatch<SetStateAction<Set<number>>>,
	setActiveId: Dispatch<SetStateAction<number | undefined>>,
	readOnly?: boolean,
	style?: Partial<CSSStyleDeclaration>,
}

export function CardEditor(props: CardEditorProps) {
	const { cardId, setActiveId, setSelectedIds, readOnly = false, style = {} } = props;
	const { doc, v } = useDocumentWithV();
	const { viewDpi } = useContext(DpiContext);
	const cardEntry = useMemo(() => firstMatchingEntry<Card>(doc, { type: "Card", id: cardId }), [doc, v, cardId]);

	const addCardAndFocus = useCallback(() => {
		const card = createTestCard("New Card", "colorless");
		doc.addCard(card);
		setActiveId(card.id);
		setSelectedIds(new Set([card.id]));
	}, [setActiveId]);

	if (cardEntry) {
		return (
			<div className="card-editor" style={{ ...style, "--in": `${viewDpi}px` } as CSSProperties}>
				<CardFrame cardEntry={cardEntry} field={"frame"} readOnly={readOnly}/>
				<div className="title-bar name-line">
					<TextField cardEntry={cardEntry} field={"name"} minFontSize={5} maxFontSize={10.5} readOnly={readOnly}/>
					<ManaTextField cardEntry={cardEntry} field={"cost"} minFontSize={4} maxFontSize={9} readOnly={readOnly}/>
				</div>

				<ImageField cardEntry={cardEntry} field={"image"}/>
				<div className="title-bar type-line">
					<TextField cardEntry={cardEntry} field={"type"} minFontSize={4} maxFontSize={8.5} readOnly={readOnly}/>

					<div className="set-symbol"></div>
				</div>
				<TextField cardEntry={cardEntry} field={"cardText"} minFontSize={4} maxFontSize={9} readOnly={readOnly}/>
				<PowerToughnessBackground cardEntry={cardEntry} field={"ptBox"} checkField={"pt"} readOnly={readOnly}/>
				<TextField cardEntry={cardEntry} field={"pt"} minFontSize={5} maxFontSize={10.5} readOnly={readOnly}/>
			</div>
		);
	} else {
		return (
			<div className="card-editor" style={{ "--in": `${viewDpi}px` } as CSSProperties}>
				<NonIdealState
					title="No Card Focused"
					description="Select a card from the list on the right or create a new one."
					action={<Button icon="plus" onClick={addCardAndFocus}>Create a card</Button>}
				/>
			</div>
		);
	}
}
