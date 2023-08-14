import React, { ReactNode, useCallback, useMemo, useState } from "react";
import { Button, Tooltip } from "@blueprintjs/core";
import { CardEditor } from "./CardEditor";
import { Header } from "./Header";
import { ReactEditor, Slate, useSlateWithV } from "slate-react";
import { CardList, listColumn } from "./CardList";
import { DocumentEditor, EditorWithVersion, createDocumentEditor } from "../slate";
import { Card, createTestCard, isCard } from "./slate/Card";
import { Document } from "./slate/Document";
import { DocumentContext, useDocument } from "./contexts/DocumentContext";
import { Node, NodeEntry, Text } from "slate";
import { ImageStoreContext, imageEntry } from "./contexts/ImageStoreContext";
import { loadSet, saveSet } from "../saveLoad";
import { FocusedEditorContext, FocusedEditorContextValue } from "./contexts/FocusedEditorContext";
import { HistoryWrapper } from "./contexts/HistoryContext";
import { DpiContextWrapper } from "./contexts/DpiContext";


const startingDocument: [Document] = [
	{
		type: "Document",
		name: "Untitled",
		children: [],
	},
];

const listColumns: listColumn[] = [
	{ field: "name", header: "Name" },
	{ field: "cost", header: "Cost" },
	{ field: "type", header: "Type" },
];

export function getApp() {
	return <App/>;
}

export function App() {
	const [activeId, setActiveId] = useState<number | undefined>();
	const [selectedIds, setSelectedIds] = useState(new Set<number>());
	const [doc, setDoc] = useState<DocumentEditor | undefined>(() => createDocumentEditor(startingDocument));
	const [focusedEditor, setFocusedEditor] = useState<ReactEditor>();
	const [cachedFocusedEditor, setCachedFocusedEditor] = useState<ReactEditor>();
	const focusedEditorValue = useMemo<FocusedEditorContextValue>(() => ({ focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor }), [focusedEditor, setFocusedEditor, cachedFocusedEditor, setCachedFocusedEditor]);
	const [imageStore, setImageStore] = useState(new Map<number, imageEntry>());
	const imageStoreValue = useMemo(() => [imageStore, setImageStore] as const, [imageStore, setImageStore]);

	const [viewDpi, setViewDpi] = useState(150);
	const [exportDpi, setExportDpi] = useState(150);
	const [lockExportDpi, setLockExportDpi] = useState(true);

	const saveThisSet = useCallback(() => saveSet(doc!, imageStore), [doc, imageStore]);
	const loadThisSet = useCallback(() => loadSet(setDoc, setImageStore), [setDoc, setImageStore]);

	const addCardAndFocus = useCallback(() => {
		if (!doc) return;
		const card = addNewCardToDoc(doc);
		setActiveId(card.id);
	}, [doc, setActiveId]);

	return (
		<ImageStoreContext.Provider value={imageStoreValue}>
			<DpiContextWrapper value={{ viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi }}>
				{doc ? (
					<Slate editor={doc} initialValue={doc.children}>
						<DocumentWrapper>
							<FocusedEditorContext.Provider value={focusedEditorValue}>
								<HistoryWrapper setActiveId={setActiveId}>
									<Header
										activeId={activeId}
										selectedIds={selectedIds}
										saveSet={saveThisSet}
										loadSet={loadThisSet}
									/>
									<div id="content">
										<CardEditor cardId={activeId} addCard={addCardAndFocus}/>
										<MainCardList
											columns={listColumns}
											selectedIds={selectedIds}
											setSelectedIds={setSelectedIds}
											activeId={activeId}
											setActiveId={setActiveId}
											addCard={addCardAndFocus}
										/>
									</div>
								</HistoryWrapper>
							</FocusedEditorContext.Provider>
						</DocumentWrapper>
					</Slate>
				) : (
					<div>Loading...</div>
				)}
			</DpiContextWrapper>
		</ImageStoreContext.Provider>
	);
}

export interface DocumentWrapperProps {
	children: ReactNode,
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
	addCard: () => void;
}

export function MainCardList(props: MainCardListProps) {
	const { columns, selectedIds, activeId, setSelectedIds, setActiveId, addCard } = props;
	const doc = useDocument();
	const listedCardEntries = [...Node.children(doc, [0])].filter(([card]) => isCard(card)) as NodeEntry<Card>[];

	return (
		<div id="main-card-list-container">
			{/* <Popover
				content={<Menu>
					<MenuItem text="Planeswalker"/>
				</Menu>}
				renderTarget={({ isOpen: isPopoverOpen, ref: popoverRef, ...popoverProps }) => (
					<Tooltip
						content="I have a popover!"
						disabled={isPopoverOpen}
						openOnTargetFocus={false}
						renderTarget={({ isOpen: isTooltipOpen, ref: tooltipRef, ...tooltipProps }) => (
							<ButtonGroup
								{...tooltipProps}
								ref={mergeRefs(tooltipRef, popoverRef)}
							>
								<Button icon="add" onClick={addCard}/>
								<Button {...popoverProps} icon="caret-down" active={isPopoverOpen}/>
							</ButtonGroup>
						)}
					/>
				)}
			/> */}

			<Tooltip
				content="Add Card"
				renderTarget={({ ref, ...tooltipProps }) => (
					<Button {...tooltipProps} ref={ref} icon="plus" onClick={addCard}/>
				)}
			/>
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

export function addNewCardToDoc(doc: DocumentEditor): Card {
	const documentNode = doc.children[0] as Document;
	const child = documentNode.children[0];
	const card = createTestCard("New Card", "colorless");
	doc.withoutNormalizing(() => {
		if (documentNode.children.length === 1 && (child as Text).text === "") {
			doc.insertNodes(card, { at: [0, 0] }); // if the list is empty an empty text node gets added when normalized. When normalized after adding, if the text node is first, the block is assumed to contain inlines only, and deletes the following block node, so we put at the start
		} else {
			doc.insertNodes(card, { at: [0, documentNode.children.length] });
		}
	});
	return card;
}
