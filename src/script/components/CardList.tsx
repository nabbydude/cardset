import React, { MouseEventHandler, useCallback, useState } from "react";

import { EditableProps, createCardFieldEditor, firstMatchingPath, renderElement, renderLeaf, useViewOfMatchingNode } from "../slate";
import { Card } from "./slate/Card";
import { useDocument } from "./contexts/DocumentContext";
import { NodeEntry, Path, Transforms } from "slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { ContextMenu, ContextMenuChildrenProps, HTMLTable, Menu, MenuItem } from "@blueprintjs/core";

export interface listColumn {
	field: string,
	header: string,
}

export interface CardListProps {
	columns: listColumn[],
	cardEntries: NodeEntry<Card>[],
	selectedIds: Set<number>, // ids of selected cards
	activeId?: number,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	setActiveId: (card: number) => void,
}

export function CardList(props: CardListProps) {
	const { columns, cardEntries, selectedIds, setSelectedIds, activeId, setActiveId } = props;
	// return null;
	return (
		<HTMLTable className="card-list" interactive={true}>
			<thead>
				<tr>
					{columns.map(({ field, header }) => (<th key={field}>{header}</th>))}
				</tr>
			</thead>
			<tbody>
				{cardEntries.map(cardEntry => (
					<CardRow
						key={cardEntry[0].id}
						columns={columns}
						cardEntry={cardEntry}
						active={activeId === cardEntry[0].id}
						setActiveId={setActiveId}
						selected={selectedIds.has(cardEntry[0].id)}
						setSelectedIds={setSelectedIds}
					/>
				))}
			</tbody>
		</HTMLTable>
	);
}

export interface CardRowProps {
	columns: listColumn[],
	cardEntry: NodeEntry<Card>,
	active: boolean,
	setActiveId: (card: number) => void,
	selected: boolean,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
}

export function CardRow(props: CardRowProps) {
	const { columns, cardEntry, active, setActiveId, selected, setSelectedIds } = props;
	const doc = useDocument();
	const [card, path] = cardEntry;

	const onClick = useCallback((e => {
		if (e.ctrlKey) {
			setSelectedIds(old => new Set(old.delete(card.id) ? old : old.add(card.id))); // delete entry if it exists and copy set (immutability is v inefficient), or if it doesn't exist, add it and copy set
		} else {
			setSelectedIds(new Set([card.id]));
		}
		setActiveId(card.id);
	}) as MouseEventHandler<HTMLTableRowElement>, [setActiveId, setSelectedIds]);

	const classList: string[] = [];
	if (selected) classList.push("selected");
	if (active) classList.push("active");
	return (
		<ContextMenu
			content={
				<Menu>
					<MenuItem text="Delete" intent="danger" onClick={useCallback(() => {
						const path = firstMatchingPath(doc, { type: "Card", id: card.id });
						if (!path) throw Error("This card doesn't exist for some reason!");
						Transforms.delete(doc, { at: path });
						console.log(doc);
					}, [doc])} />
				</Menu>
			}
		>
			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
				<tr
					onClick={onClick}
					className={classList.join(" ") + " " + className}
					onContextMenu={onContextMenu}
					ref={ref}
				>
					{popover}{/* this is a portal so it doesnt break table schema */}
					{columns.map(({ field }) => <CardCell key={field} cardPath={path} field={field}/>)}
				</tr>
			)}
		</ContextMenu>
	);
}

export interface CardCellProps extends EditableProps {
	cardPath: Path,
	field: string,
}

export function CardCell(props: CardCellProps) {
	const { cardPath, field, ...rest } = props;
	const doc = useDocument();
	const [editor] = useState(createCardFieldEditor);
	useViewOfMatchingNode(editor, doc, cardPath, { type: "Field", name: field }, true);

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				as="td"
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				disableDefaultStyles={true}
				style={{
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
				}}
				readOnly={true}
				{...rest}
			/>
		</Slate>
	);
}
