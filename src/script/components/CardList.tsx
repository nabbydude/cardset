import React, { MouseEventHandler, useCallback } from "react";

import { first_matching_entry, first_matching_path, to_single_line_plaintext } from "../slate";
import { Card } from "./slate/Card";
import { useContextMenu } from "./ContextMenuContext";
import { useDocument } from "./DocumentContext";
import { Editor, Transforms } from "slate";
import { Node } from "slate";



export interface list_column {
	field: string,
	name: string,
}

export interface CardListProps {
	columns: list_column[],
	cards: Card[],
	selected_ids: Set<number>, // ids of selected cards
	active_id?: number,
	set_selected_ids: (cards_or_func: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	set_active_id: (card: number) => void,
}

export function CardList(props: CardListProps) {
	const {columns, cards, selected_ids, active_id, set_selected_ids, set_active_id } = props;
	return (
		<table className="card_list">
			<thead>
				<tr>
					{columns.map(({ field, name }) => (<th key={field} className={field}>{name}</th>))}
				</tr>
			</thead>
			<tbody>
				{cards.map(card => (<CardRow key={card.id} card={card} columns={columns} selected={selected_ids.has(card.id)} active={active_id === card.id} set_selected_ids={set_selected_ids} set_active_id={set_active_id}/>))}
			</tbody>
		</table>
	);
}

export interface CardRowProps {
	card: Card,
	columns: list_column[],
	selected: boolean;
	active: boolean;
	set_selected_ids: (cards_or_func: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	set_active_id: (card: number) => void,
}

export function CardRow(props: CardRowProps) {
	const { card, columns, selected, active, set_selected_ids, set_active_id } = props;

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
			{columns.map(({ field }) => (<CardCell key={field} card={card} field={field}/>))}
		</tr>
	);
}

export interface CardCellProps {
	card: Card,
	field: string,
}

export function CardCell(props: CardCellProps) {
	const { card, field } = props;
	const [markup] = first_matching_entry(card, { type: "Field", name: field }) ?? [];
	return (
		<td>{markup ? to_single_line_plaintext([markup]) : undefined}</td>
	);
}
