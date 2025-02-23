import React, { CSSProperties, Dispatch, SetStateAction, useCallback, useContext } from "react";
import { Button, NonIdealState } from "@blueprintjs/core";
import { DpiContext } from "./contexts/DpiContext";
import { add_card } from "../project";
import { ProjectContext } from "./contexts/ProjectContext";
import { card, createTestCard } from "../card";
import { HistoryContext } from "./contexts/HistoryContext";
import { Control } from "./Control";
import { controls } from "../controls";

export interface CardEditorProps {
	card: card | undefined,
	setSelectedCards: Dispatch<SetStateAction<Set<card>>>,
	setActiveCard: Dispatch<SetStateAction<card | undefined>>,
	readOnly?: boolean,
	style?: Partial<CSSStyleDeclaration>,
}

export function CardEditor(props: CardEditorProps) {
	const { card, setActiveCard, setSelectedCards, readOnly = false, style = {} } = props;
	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);
	const { viewDpi } = useContext(DpiContext);

	const addCardAndFocus = useCallback(() => {
		const new_card = createTestCard("New Card", "colorless");
		add_card(project, history, { type: "none" }, new_card);
		setActiveCard(new_card);
		setSelectedCards(new Set([new_card]));
	}, [project, history, setActiveCard, setSelectedCards]);

	if (card) {
		return (
			<div className="card-editor" style={{ ...style, "--in": `${viewDpi}px` } as CSSProperties}>
				<Control card={card} control={controls["frame"]} readOnly={readOnly}/>
				<div className="title-bar name-line">
					<Control card={card} control={controls["name"]} readOnly={readOnly}/>
					<Control card={card} control={controls["cost"]} readOnly={readOnly}/>
				</div>

				<Control card={card} control={controls["image"]} readOnly={readOnly}/>

				<div className="title-bar type-line">
					<Control card={card} control={controls["type"]} readOnly={readOnly}/>
					<div className="set-symbol"></div>
				</div>
				<Control card={card} control={controls["cardText"]} readOnly={readOnly}/>
				<Control card={card} control={controls["ptBox"]} readOnly={readOnly}/>
				<Control card={card} control={controls["pt"]} readOnly={readOnly}/>
			</div>
		);
		// return (
		// 	<div className="card-editor" style={{ ...style, "--in": `${viewDpi}px` } as CSSProperties}>
		// 		<CardFrame card={card} controlId={"frame"} property={card.properties.get("frame") as image_property} readOnly={readOnly}/>
		// 		<div className="title-bar name-line">
		// 			<TextControl card={card} controlId={"name"} property={card.properties.get("name") as text_property} minFontSize={5} maxFontSize={10.5} readOnly={readOnly}/>
		// 			<ManaTextControl card={card} controlId={"cost"} property={card.properties.get("cost") as text_property} minFontSize={4} maxFontSize={9} readOnly={readOnly}/>
		// 		</div>

		// 		<ImageControl card={card} controlId={"image"} property={card.properties.get("image") as image_property}/>
		// 		<div className="title-bar type-line">
		// 			<TextControl card={card} controlId={"type"} property={card.properties.get("type") as text_property} minFontSize={4} maxFontSize={8.5} readOnly={readOnly}/>

		// 			<div className="set-symbol"></div>
		// 		</div>
		// 		<TextControl card={card} controlId={"cardText"} property={card.properties.get("cardText") as text_property} minFontSize={4} maxFontSize={9} readOnly={readOnly}/>
		// 		<PowerToughnessBackground card={card} controlId={"ptBox"} property={card.properties.get("ptBox") as image_property} checkPropertyId={"pt"} readOnly={readOnly}/>
		// 		<TextControl card={card} controlId={"pt"} property={card.properties.get("pt") as text_property} minFontSize={5} maxFontSize={10.5} readOnly={readOnly}/>
		// 	</div>
		// );
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
