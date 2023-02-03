import React, { KeyboardEvent, useCallback, useState } from "react";
import { Editor } from "slate";
import { Editable, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react";
import { card } from "../card";
import { create_card_field_editor, CustomEditor } from "../slate";
import { CardFrame } from "./CardFrame";
import { PowerToughnessBox } from "./PowerToughnessBox";
import { CodeBlockElement } from "./slate/CodeBlock";
import { ParagraphElement } from "./slate/Paragraph";
import { StyledTextElement } from "./slate/StyledText";

export interface CardEditorProps {
	card: card;
}

export function CardEditor(props: CardEditorProps) {
	const { card } = props;

	const [nameEditor  ] = useState(create_card_field_editor);
	const [costEditor  ] = useState(create_card_field_editor);
	const [typeEditor  ] = useState(create_card_field_editor);
	const [rulesEditor ] = useState(create_card_field_editor);
	const [flavorEditor] = useState(create_card_field_editor);

	// Define a rendering function based on the element passed to `props`. We use
	// `useCallback` here to memoize the function for subsequent renders.
	const thisRenderElement = useCallback((props: RenderElementProps) => {
		switch (props.element.type) {
			case "CodeBlock": {
				return <CodeBlockElement {...props}/>;
			}
			case "Paragraph": {
				return <ParagraphElement {...props}/>;
			}
		}
	}, []);

	// Define a leaf rendering function that is memoized with `useCallback`.
	const thisRenderLeaf = useCallback((props: RenderLeafProps) => {
		return <StyledTextElement {...props} />
	}, []);

	const nameOnKeyDown   = useCallback((e: KeyboardEvent) => onKeyDown(e, nameEditor  ), [nameEditor  ]);
	const costOnKeyDown   = useCallback((e: KeyboardEvent) => onKeyDown(e, costEditor  ), [costEditor  ]);
	const typeOnKeyDown   = useCallback((e: KeyboardEvent) => onKeyDown(e, typeEditor  ), [typeEditor  ]);
	const rulesOnKeyDown  = useCallback((e: KeyboardEvent) => onKeyDown(e, rulesEditor ), [rulesEditor ]);
	const flavorOnKeyDown = useCallback((e: KeyboardEvent) => onKeyDown(e, flavorEditor), [flavorEditor]);

	return (
		<div className="card_editor">
			<CardFrame frame={card.frame}/>
			<div className="name_line">
				<Slate editor={nameEditor} value={card.name.children}>
					<Editable
						className="name"
						renderElement={thisRenderElement}
						renderLeaf={thisRenderLeaf}
						onKeyDown={nameOnKeyDown}
					/>
				</Slate>
				<Slate editor={costEditor} value={card.cost.children}>
					<Editable
						className="cost"
						renderElement={thisRenderElement}
						renderLeaf={thisRenderLeaf}
						onKeyDown={costOnKeyDown}
					/>
				</Slate>
			</div>

			<div className="type_line">
				<Slate editor={typeEditor} value={card.type.children}>
					<Editable
						className="type"
						renderElement={thisRenderElement}
						renderLeaf={thisRenderLeaf}
						onKeyDown={typeOnKeyDown}
					/>
				</Slate>
				<div className="set_symbol"></div>
			</div>
			<div className="text_box">
				<Slate editor={rulesEditor} value={card.rules_text.children}>
					<Editable
						className="rules_text"
						renderElement={thisRenderElement}
						renderLeaf={thisRenderLeaf}
						onKeyDown={rulesOnKeyDown}
					/>
				</Slate>
				<div className="visual_box"></div>
				<hr className="flavor_bar"/>
				<Slate editor={flavorEditor} value={card.flavor_text.children}>
					<Editable
						className="flavor_text"
						renderElement={thisRenderElement}
						renderLeaf={thisRenderLeaf}
						onKeyDown={flavorOnKeyDown}
					/>
				</Slate>
				<div className="visual_box"></div>
			</div>
			<PowerToughnessBox
				value={card.pt}
				renderElement={thisRenderElement}
				renderLeaf={thisRenderLeaf}
			/>
		</div>
	);
}

function onKeyDown(e: KeyboardEvent, editor: Editor) {
	if (!e.ctrlKey) {
		return;
	}

	switch (e.key) {
		case "`": e.preventDefault(); CustomEditor.toggleCodeBlock(editor); break;
		case "b": e.preventDefault(); CustomEditor.toggleBoldMark(editor); break;
	}
}
