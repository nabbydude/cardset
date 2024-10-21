import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useContext } from "react";
import { TextControl, TextControlProps } from "./TextControl";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBackground } from "./PowerToughnessBackground";
import { ImageControl } from "./ImageControl";
import { ManaTextControl } from "./ManaTextControl";
import { Button, NonIdealState } from "@blueprintjs/core";
import { DpiContext } from "./contexts/DpiContext";
import { add_card } from "../project";
import { ProjectContext } from "./contexts/ProjectContext";
import { card, createTestCard } from "../card";
import { HistoryContext } from "./contexts/HistoryContext";

export interface CardEditorProps {
	card: card | undefined,
	setSelectedIds: Dispatch<SetStateAction<Set<string>>>,
	setActiveId: Dispatch<SetStateAction<string | undefined>>,
	readOnly?: boolean,
	style?: Partial<CSSStyleDeclaration>,
}

export function CardEditor(props: CardEditorProps) {
	const { card, setActiveId, setSelectedIds, readOnly = false, style = {} } = props;
	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);
	const { viewDpi } = useContext(DpiContext);

	const addCardAndFocus = useCallback(() => {
		const new_card = createTestCard("New Card", "colorless");
		add_card(project, history, { type: "none" }, new_card);
		setActiveId(new_card.id);
		setSelectedIds(new Set([new_card.id]));
	}, [project, history, setActiveId, setSelectedIds]);

	type a = TextControlProps["property"]
	if (card) {
		return (
			<div className="card-editor" style={{ ...style, "--in": `${viewDpi}px` } as CSSProperties}>
				<CardFrame card={card} controlId={"frame"} propertyId={"frame"} readOnly={readOnly}/>
				<div className="title-bar name-line">
					<TextControl card={card} controlId={"name"} propertyId={"name"} minFontSize={5} maxFontSize={10.5} readOnly={readOnly}/>
					<ManaTextControl card={card} controlId={"cost"} propertyId={"cost"} minFontSize={4} maxFontSize={9} readOnly={readOnly}/>
				</div>

				<ImageControl card={card} controlId={"image"} propertyId={"image"}/>
				<div className="title-bar type-line">
					<TextControl card={card} controlId={"type"} propertyId={"type"} minFontSize={4} maxFontSize={8.5} readOnly={readOnly}/>

					<div className="set-symbol"></div>
				</div>
				<TextControl card={card} controlId={"cardText"} propertyId={"cardText"} minFontSize={4} maxFontSize={9} readOnly={readOnly}/>
				<PowerToughnessBackground card={card} controlId={"ptBox"} propertyId={"ptBox"} checkPropertyId={"pt"} readOnly={readOnly}/>
				<TextControl card={card} controlId={"pt"} propertyId={"pt"} minFontSize={5} maxFontSize={10.5} readOnly={readOnly}/>
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
