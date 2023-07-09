import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { ReactEditor, Slate, useSlateWithV } from "slate-react";
import { CardList, listColumn } from "./CardList";
import { DocumentEditor, EditorWithVersion, createDocumentEditor, firstMatchingElement, toSingleLinePlaintext } from "../slate";
import { Card, createTestCard, isCard } from "./slate/Card";
import { Document } from "./slate/Document";
import { DocumentContext, useDocument } from "./contexts/DocumentContext";
import { Field } from "./slate/Field";
import { ContextMenu, contextMenuData } from "./ContextMenu";
import { ContextMenuContext } from "./contexts/ContextMenuContext";
import { Editor, Node, NodeEntry, Range, Transforms } from "slate";
import { domToPng } from "modern-screenshot";
import { ImageStoreContext, imageEntry } from "./contexts/ImageStoreContext";
import { loadSet, saveSet } from "../saveLoad";
import { SelectionTransforms } from "slate/dist/interfaces/transforms/selection";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";

const startingDocument: [Document] = [
	{
		type: "Document",
		name: "Untitled",
		children: [
			createTestCard("Test Card 1", "red"),
			createTestCard("Test Card 2", "blue"),
			createTestCard("Test Card 3", "green"),
		],
	},
];

const listColumns = [
	{ field: "name", name: "Name", width: 100 },
	{ field: "cost", name: "Cost", width: 100 },
	{ field: "type", name: "Type", width: 100 },
];

export function getApp() {
	return <App/>;
}

export function App() {
	const [activeId, setActiveId] = useState(0);
	const [selectedIds, setSelectedIds] = useState(new Set<number>());
	const [doc, setDoc] = useState<DocumentEditor | undefined>(() => createDocumentEditor(startingDocument));
	const [contextMenu, setContextMenu] = useState<contextMenuData>();
	const [focusedEditor, setFocusedEditor] = useState<ReactEditor>();
	const focusedEditorValue = useMemo(() => [focusedEditor, setFocusedEditor] as const, [focusedEditor, setFocusedEditor]);
	const [imageStore, setImageStore] = useState(new Map<number, imageEntry>());
	const imageStoreValue = useMemo(() => [imageStore, setImageStore] as const, [imageStore, setImageStore]);

	const saveActiveCardImage = useCallback(() => saveCardImage(doc!, activeId), [doc, activeId]);
	const saveThisSet = useCallback(() => saveSet(doc!, imageStore), [doc, imageStore]);
	const loadThisSet = useCallback(() => loadSet(setDoc, setImageStore), [setDoc, setImageStore]);

	useEffect(() => {
		if (!doc) return;
		const handler = (e: KeyboardEvent) => {
			if (!e.ctrlKey) return;
			if (e.code !== "KeyZ") return;
			let selection;
			if (e.shiftKey) {
				if (doc.history.redos.length > 0) selection = doc.history.redos[doc.history.redos.length - 1]?.selectionBefore;
				if (selection) doc.select(selection); // undo/redo use setSelection which noops if there's no existing selection, so we force it here
				doc.redo();
			} else {
				if (doc.history.undos.length > 0) selection = doc.history.undos[doc.history.undos.length - 1]?.selectionBefore;
				doc.undo();
				if (selection) doc.select(selection); // undo/redo use setSelection which noops if there's no existing selection, so we force it here
			}
			if (selection) {
				const cardEntry = doc.above<Card>({ at: selection, match: node => isCard(node) });
				if (cardEntry) setActiveId(cardEntry[0].id);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [doc]);

	return (
		<ContextMenuContext.Provider value={setContextMenu}>
			<ImageStoreContext.Provider value={imageStoreValue}>
				{doc ? (
					<Slate editor={doc} initialValue={doc.children}>
						<FocusedEditorContext.Provider value={focusedEditorValue}>
							<DocumentWrapper>
								<Header
									saveActiveCardImage={saveActiveCardImage}
									saveSet={saveThisSet}
									loadSet={loadThisSet}
								/>
								<div id="content">
									<CardEditor cardId={activeId}/>
									<MainCardList
										columns={listColumns}
										selectedIds={selectedIds}
										setSelectedIds={setSelectedIds}
										activeId={activeId}
										setActiveId={setActiveId}
									/>
								</div>
								{contextMenu ? <ContextMenu position={contextMenu.position} options={contextMenu.options}/> : undefined}
							</DocumentWrapper>
						</FocusedEditorContext.Provider>
					</Slate>
				) : (
					<div>Loading...</div>
				)}
				
			</ImageStoreContext.Provider>
		</ContextMenuContext.Provider>
	);
}

export interface DocumentWrapperProps {
	children: ReactNode[],
}

export function DocumentWrapper(props: DocumentWrapperProps) {
	const docWithV = useSlateWithV() as unknown as EditorWithVersion<DocumentEditor>;

	return (
		<DocumentContext.Provider value={docWithV}>
			{props.children}
		</DocumentContext.Provider>
	);
}

export interface MainCardListProps {
	columns: listColumn[],
	selectedIds: Set<number>, // ids of selected cards
	activeId?: number,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	setActiveId: (card: number) => void,
}

export function MainCardList(props: MainCardListProps) {
	const { columns, selectedIds, activeId, setSelectedIds, setActiveId } = props;
	const doc = useDocument();
	const listedCardEntries = [...Node.children(doc, [0])].filter(([card]) => isCard(card)) as NodeEntry<Card>[];

	return (
		<div id="mainCardListContainer">
			<button onClick={useCallback(() => addNewCardToDoc(doc), [doc])}>New Card</button>
			<CardList
				columns={columns}
				cardEntries={listedCardEntries}
				selectedIds={selectedIds}
				setSelectedIds={setSelectedIds}
				activeId={activeId}
				setActiveId={setActiveId}
			/>
		</div>
	);
}

export async function saveCardImage(doc: DocumentEditor, activeId: number) {
	const editorElem = document.querySelector("div.card-editor") as HTMLDivElement | null;
	if (!editorElem) {
		console.warn("No active card editor!");
		return;
	}
	const card = firstMatchingElement<Card>(doc, { type: "Card", id: activeId });
	let name: string;
	if (card) {
		const nameNode = firstMatchingElement<Field>(card, { type: "Field", name: "name" });
		if (nameNode) name = toSingleLinePlaintext(nameNode.children);
	}
	name ||= "Card";
	const png = await domToPng(editorElem);
	const link = document.createElement("a");
	link.download = `${name}.png`;
	link.href = png;
	link.click();
}

export function addNewCardToDoc(doc: DocumentEditor) {
	const documentNode = doc.children[0] as Document;
	Transforms.insertNodes(doc, createTestCard("New Card", "white"), { at: [0, documentNode.children.length] });
}
