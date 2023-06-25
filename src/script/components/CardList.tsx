import React, { MouseEventHandler, useCallback, useState } from "react";

import { create_card_field_editor, first_matching_entry, first_matching_path, renderElement, renderLeaf, to_single_line_plaintext, useViewOfMatchingNode } from "../slate";
import { Card } from "./slate/Card";
import { useContextMenu } from "./contexts/ContextMenuContext";
import { useDocument } from "./contexts/DocumentContext";
import { Editor, NodeEntry, Path, Transforms, path } from "slate";
import { Node } from "slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { EditableProps } from "slate-react/dist/components/editable";



export interface list_column {
	field: string,
	name: string,
}

export interface CardListProps {
	columns: list_column[],
	card_entries: NodeEntry<Card>[],
	selected_ids: Set<number>, // ids of selected cards
	active_id?: number,
	set_selected_ids: (cards_or_func: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	set_active_id: (card: number) => void,
}

export function CardList(props: CardListProps) {
	const {columns, card_entries, selected_ids, active_id, set_selected_ids, set_active_id } = props;
	return (
		<table className="card_list">
			<thead>
				<tr>
					{columns.map(({ field, name }) => (<th key={field} className={field}>{name}</th>))}
				</tr>
			</thead>
			<tbody>
				{card_entries.map(([card, path]) => (<CardRow key={card.id} card_path={path} columns={columns} selected={selected_ids.has(card.id)} active={active_id === card.id} set_selected_ids={set_selected_ids} set_active_id={set_active_id}/>))}
			</tbody>
		</table>
	);
}

export interface CardRowProps {
	card_path: Path,
	columns: list_column[],
	selected: boolean;
	active: boolean;
	set_selected_ids: (cards_or_func: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	set_active_id: (card: number) => void,
}

export function CardRow(props: CardRowProps) {
	const { card_path, columns, selected, active, set_selected_ids, set_active_id } = props;
	const doc = useDocument();
	const card = Node.get(doc, card_path) as Card;
	const context_menu = useContextMenu();

	const onMouseDown = useCallback((e => {
		if (e.ctrlKey) {
				set_selected_ids(old => new Set(old.delete(card.id) ? old : old.add(card.id)));
		} else {
			set_selected_ids(new Set([card.id]));
		}
		set_active_id(card.id);
	}) as MouseEventHandler<HTMLTableRowElement>, [set_selected_ids, set_active_id]);

	const onContextMenu = useCallback((e => {
		context_menu({
			position: [e.pageX, e.pageY],
			options: [
				{
					name: "Delete",
					handler: (e, doc) => {
						const path = first_matching_path(doc, { type: "Card", id: card.id });
						Transforms.delete(doc, { at: path });
					},
				}
			],
		});
		e.preventDefault();
	}) as MouseEventHandler<HTMLTableRowElement>, [set_selected_ids, set_active_id]);

	const classList = [];
	if (selected) classList.push("selected");
	if (active) classList.push("active");
	return (
		<tr onMouseDown={onMouseDown} className={classList.join(" ")} onContextMenu={onContextMenu}>
			{columns.map(({ field }) => (<CardCell key={field} card_path={card_path} field={field}/>))}
		</tr>
	);
}

export interface CardCellProps extends EditableProps {
	card_path: Path,
	field: string,
}

export function CardCell(props: CardCellProps) {
	const { card_path, field, ...rest } = props;
	const doc = useDocument();
	const [editor] = useState(create_card_field_editor);
	useViewOfMatchingNode(editor, doc, card_path, { type: "Field", name: field });

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				as="td"
				className={field}
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
