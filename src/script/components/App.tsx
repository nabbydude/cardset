import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { ReactEditor, Slate, useSlateWithV } from "slate-react";
import { CardList, list_column } from "./CardList";
import { DocumentEditor, EditorWithVersion, create_document_editor, first_matching_element, to_single_line_plaintext } from "../slate";
import { Card, create_test_card, isCard } from "./slate/Card";
import { Document } from "./slate/Document";
import { DocumentContext, useDocument } from "./contexts/DocumentContext";
import html2canvas from "html2canvas";
import { Field } from "./slate/Field";
import { ContextMenu, context_menu_data } from "./ContextMenu";
import { ContextMenuContext } from "./contexts/ContextMenuContext";
import { Transforms } from "slate";

const starting_document: [Document] = [
	{
		type: "Document",
		name: "Untitled",
		children: [
			create_test_card("Test Card 1", "red"),
			create_test_card("Test Card 2", "blue"),
			create_test_card("Test Card 3", "green"),
		],
	},
];

const list_columns = [
	{ field: "name", name: "Name", width: 100 },
	{ field: "cost", name: "Cost", width: 100 },
	{ field: "type", name: "Type", width: 100 },
];

export function get_App() {
	return <App/>;
}

export function App() {
	const [active_id, set_active_id] = useState(0);
	const [selected_ids, set_selected_ids] = useState(new Set<number>());
	const [doc] = useState(() => create_document_editor(starting_document));
	const [contextMenu, setContextMenu] = useState<context_menu_data>();
	const [focused_editor, set_focused_editor] = useState<ReactEditor>();
	const focused_editor_value = useMemo(() => [focused_editor, set_focused_editor] as const, [focused_editor, set_focused_editor]);

	return (
		<ContextMenuContext.Provider value={setContextMenu}>
			<Slate editor={doc} value={doc.children}>
				<FocusedEditorContext.Provider value={focused_editor_value}>
					<DocumentWrapper>
						<Header save_active_card_image={useCallback(() => save_card_image(doc, active_id), [doc, active_id])}/>
						<div id="content">
							<CardEditor card_id={active_id}/>
							<MainCardList
								columns={list_columns}
								selected_ids={selected_ids}
								set_selected_ids={set_selected_ids}
								active_id={active_id}
								set_active_id={set_active_id}
							/>
						</div>
						{contextMenu ? <ContextMenu position={contextMenu.position} options={contextMenu.options}/> : undefined}
					</DocumentWrapper>
				</FocusedEditorContext.Provider>
			</Slate>
		</ContextMenuContext.Provider>
	);
}

export interface DocumentWrapperProps {
	children: ReactNode[],
}

export function DocumentWrapper(props: DocumentWrapperProps) {
	const doc = useSlateWithV() as unknown as EditorWithVersion<DocumentEditor>;
	return (
		<DocumentContext.Provider value={doc}>
			{props.children}
		</DocumentContext.Provider>
	);
}

export interface MainCardListProps {
	columns: list_column[],
	selected_ids: Set<number>, // ids of selected cards
	active_id?: number,
	set_selected_ids: (cards_or_func: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	set_active_id: (card: number) => void,
}

export function MainCardList(props: MainCardListProps) {
	const {columns, selected_ids, active_id, set_selected_ids, set_active_id } = props;
	const doc = useDocument();
	const document_node = doc.children[0] as Document;
	const listed_cards = useMemo(() => document_node.children.filter(isCard), [document_node]);

	return (
		<div id="main_card_list_container">
			<button onClick={useCallback(() => add_new_card_to_doc(doc), [doc])}>New Card</button>
			<CardList
				columns={columns}
				cards={listed_cards}
				selected_ids={selected_ids}
				set_selected_ids={set_selected_ids}
				active_id={active_id}
				set_active_id={set_active_id}
			/>
		</div>
	);
}

export async function save_card_image(doc: DocumentEditor, active_id: number) {
	const editor_elem = document.querySelector("div.card_editor") as HTMLDivElement | null;
	if (!editor_elem) {
		console.warn("No active card editor!");
		return;
	}
	const card = first_matching_element<Card>(doc, { type: "Card", id: active_id });
	let name: string;
	if (card) {
		const name_node = first_matching_element<Field>(card, { type: "Field", name: "name" });
		if (name_node) {
			name = to_single_line_plaintext(name_node.children);
		} else {
			name = "Card";
		}
	} else {
		name = "Card";
	}
	const canvas = await html2canvas(editor_elem);
	const link = document.createElement("a");
	link.download = `${name}.png`;
	link.href = canvas.toDataURL();
	link.click();
}

export function add_new_card_to_doc(doc: DocumentEditor) {
	const document_node = doc.children[0] as Document;
	Transforms.insertNodes(doc, create_test_card("New Card", "white"), { at: [0, document_node.children.length] });
}
