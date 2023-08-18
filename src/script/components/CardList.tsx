import React, { MouseEventHandler, useCallback, useState } from "react";

import { EditableProps, createCardFieldEditor, renderElement, renderLeaf } from "../slate";
import { Card } from "./slate/Card";
import { useDocument } from "./contexts/DocumentContext";
import { NodeEntry, Path } from "slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { Button, ContextMenu, ContextMenuChildrenProps, Divider, HTMLTable, Menu, MenuItem, Tooltip } from "@blueprintjs/core";
import { useViewOfMatchingNode } from "../multiSlate";

export interface listColumn {
	field: string,
	header: string,
}

export interface ControllableCardListProps extends CardListProps {
	addCard: () => Card,
}

export interface CardListProps {
	columns: listColumn[],
	cardEntries: NodeEntry<Card>[],
	selectedIds: Set<number>, // ids of selected cards
	activeId?: number,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	setActiveId: (card: number) => void,
	exportCards?: (ids: Iterable<number>) => void,
	deleteCards?: (ids: Iterable<number>) => void,
}

export function ControllableCardList(props: ControllableCardListProps) {
	const { addCard, ...rest } = props;
	const { selectedIds, setActiveId, setSelectedIds, deleteCards } = rest;

	const addCardAndFocus = useCallback(() => {
		const card = addCard();
		setActiveId(card.id);
		setSelectedIds(new Set([card.id]));
	}, [setActiveId]);
	const deleteSelectedCards = useCallback(() => deleteCards?.(selectedIds), [deleteCards, selectedIds]);

	return (
		<div className="controllable-card-list">
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
			<div className="controls">
				<Tooltip content="Add Card"><Button icon="plus" onClick={addCardAndFocus}/></Tooltip>
				{selectedIds.size > 0 ? (<>
					<Divider/>
					{deleteCards && <Tooltip content={`Delete ${selectedIds.size > 1 ? `${selectedIds.size} cards` : "card"}`}><Button icon="trash" onClick={deleteSelectedCards}/></Tooltip>}
					<Divider/>
					<div className="info">
						{selectedIds.size} card{selectedIds.size === 1 ? "" : "s"} selected
					</div>
				</>
				) : (
					undefined
				)}

			</div>

			<CardList {...rest}/>
		</div>
	);
}

export function CardList(props: CardListProps) {
	const { columns, cardEntries, ...rest } = props;
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
						{...rest}
					/>
				))}
			</tbody>
		</HTMLTable>
	);
}

export interface CardRowProps {
	columns: listColumn[],
	cardEntry: NodeEntry<Card>,
	activeId?: number,
	setActiveId: (card: number) => void,
	selectedIds: Set<number>,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	exportCards?: (ids: Iterable<number>) => void,
	deleteCards?: (ids: Iterable<number>) => void,
}

export function CardRow(props: CardRowProps) {
	const { columns, cardEntry, activeId, setActiveId, selectedIds, setSelectedIds, exportCards, deleteCards } = props;
	const [card, path] = cardEntry;
	const active = activeId === card.id;
	const selected = selectedIds.has(card.id);

	const onClick = useCallback((e => {
		if (e.ctrlKey) {
			setSelectedIds(old => new Set(old.delete(card.id) ? old : old.add(card.id))); // delete entry if it exists and copy set (immutability is v inefficient), or if it doesn't exist, add it and copy set
		} else {
			setSelectedIds(new Set([card.id]));
		}
		setActiveId(card.id);
	}) as MouseEventHandler<HTMLTableRowElement>, [setActiveId, setSelectedIds]);

	const exportSelectedCards = useCallback(() => exportCards?.(selectedIds), [exportCards, selectedIds]);
	const deleteSelectedCards = useCallback(() => deleteCards?.(selectedIds), [deleteCards, selectedIds]);

	const classList: string[] = [];
	if (selected) classList.push("selected");
	if (active) classList.push("active");
	
	return (
		<ContextMenu
			disabled={!(exportCards || deleteCards)}
			content={
				<Menu>
					{exportCards && <MenuItem text={`Export ${selectedIds.size > 1 ? `${selectedIds.size} cards` : "card"}`} icon="export" onClick={exportSelectedCards}/>}
					{exportCards && deleteCards && <Divider/>}
					{deleteCards && <MenuItem text={`Delete ${selectedIds.size > 1 ? `${selectedIds.size} cards` : "card"}`} icon="trash" intent="danger" onClick={deleteSelectedCards}/>}
				</Menu>
			}
		>
			{({ className, onContextMenu, ref, popover }: ContextMenuChildrenProps) => (
				<tr
					onClick={onClick}
					className={[...classList, className].join(" ")}
					onContextMenu={useCallback<MouseEventHandler<HTMLTableRowElement>>(e => {
						if (!selected) {
							setSelectedIds(new Set([card.id]));
							setActiveId(card.id);
						}
						onContextMenu(e);
					}, [selected, onContextMenu])}
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
