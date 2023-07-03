import React, { MouseEventHandler, useCallback, useState } from "react";

import { createCardFieldEditor, firstMatchingPath, renderElement, renderLeaf, useViewOfMatchingNode } from "../slate";
import { Card } from "./slate/Card";
import { useContextMenu } from "./contexts/ContextMenuContext";
import { useDocument } from "./contexts/DocumentContext";
import { NodeEntry, Path, Transforms } from "slate";
import { Node } from "slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { EditableProps } from "slate-react/dist/components/editable";



export interface listColumn {
	field: string,
	name: string,
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
	const {columns, cardEntries, selectedIds, activeId, setSelectedIds, setActiveId } = props;
	return (
		<table className="card-list">
			<thead>
				<tr>
					{columns.map(({ field, name }) => (<th key={field}>{name}</th>))}
				</tr>
			</thead>
			<tbody>
				{cardEntries.map(([card, path]) => (<CardRow key={card.id} cardPath={path} columns={columns} selected={selectedIds.has(card.id)} active={activeId === card.id} setSelectedIds={setSelectedIds} setActiveId={setActiveId}/>))}
			</tbody>
		</table>
	);
}

export interface CardRowProps {
	cardPath: Path,
	columns: listColumn[],
	selected: boolean;
	active: boolean;
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	setActiveId: (card: number) => void,
}

export function CardRow(props: CardRowProps) {
	const { cardPath, columns, selected, active, setSelectedIds, setActiveId } = props;
	const doc = useDocument();
	const card = Node.get(doc, cardPath) as Card;
	const contextMenu = useContextMenu();

	const onMouseDown = useCallback((e => {
		if (e.ctrlKey) {
			setSelectedIds(old => new Set(old.delete(card.id) ? old : old.add(card.id)));
		} else {
			setSelectedIds(new Set([card.id]));
		}
		setActiveId(card.id);
	}) as MouseEventHandler<HTMLTableRowElement>, [setSelectedIds, setActiveId]);

	const onContextMenu = useCallback((e => {
		contextMenu({
			position: [e.pageX, e.pageY],
			options: [
				{
					name: "Delete",
					handler: (e, doc) => {
						const path = firstMatchingPath(doc, { type: "Card", id: card.id });
						Transforms.delete(doc, { at: path });
					},
				}
			],
		});
		e.preventDefault();
	}) as MouseEventHandler<HTMLTableRowElement>, [setSelectedIds, setActiveId]);

	const classList = [];
	if (selected) classList.push("selected");
	if (active) classList.push("active");
	return (
		<tr onMouseDown={onMouseDown} className={classList.join(" ")} onContextMenu={onContextMenu}>
			{columns.map(({ field }) => (<CardCell key={field} cardPath={cardPath} field={field}/>))}
		</tr>
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
	useViewOfMatchingNode(editor, doc, cardPath, { type: "Field", name: field });

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				as="td"
				// className={field}
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
