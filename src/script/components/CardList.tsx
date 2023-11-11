import React, { Dispatch, MouseEventHandler, PointerEventHandler, SetStateAction, useCallback, useMemo, useState } from "react";

import { EditableProps, createCardFieldEditor, renderElement, renderLeaf } from "../slate";
import { Card } from "./slate/Card";
import { useDocument } from "./contexts/DocumentContext";
import { NodeEntry, Path } from "slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { Button, ContextMenu, ContextMenuChildrenProps, Divider, HTMLTable, Menu, MenuItem, Tooltip } from "@blueprintjs/core";
import { useViewOfMatchingNode } from "../multiSlate";
import { createTestCard } from "./slate/Card";

export interface listColumn {
	field: string,
	heading: string,
	/** width in pixels */
	width: number,
}

function setColumnProperty<K extends keyof listColumn>(setColumns: Dispatch<SetStateAction<listColumn[]>>, index: number, key: K, value: listColumn[K] | ((old: listColumn[K]) => listColumn[K])) {
	setColumns(old => {
		const out = old.slice();
		out[index] = { ...out[index], [key]: value instanceof Function ? value(out[index][key]) : value };
		return out;
	});
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ControllableCardListProps extends CardListProps {
	
}

export interface CardListProps {
	columns: listColumn[],
	cardEntries: NodeEntry<Card>[],
	selectedIds: Set<number>, // ids of selected cards
	activeId?: number,
	setColumns: Dispatch<SetStateAction<listColumn[]>>,
	setSelectedIds: Dispatch<SetStateAction<Set<number>>>,
	setActiveId: Dispatch<SetStateAction<number | undefined>>,
	exportCards?: (ids: Iterable<number>) => void,
}

export function ControllableCardList(props: ControllableCardListProps) {
	const { ...rest } = props;
	const { selectedIds, setActiveId, setSelectedIds, activeId } = rest;

	const doc = useDocument();

	const addCardAndFocus = useCallback(() => {
		const card = createTestCard("New Card", "colorless");
		doc.addCard(card);
		setActiveId(card.id);
		setSelectedIds(new Set([card.id]));
	}, [setActiveId]);

	const deleteSelectedCards = useCallback(() => {
		doc.deleteCards(selectedIds);
		if (selectedIds.has(activeId!)) setActiveId(undefined);
		setSelectedIds(new Set());
	}, [activeId, selectedIds, setActiveId, setSelectedIds]);

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
					<Tooltip content={`Delete ${selectedIds.size > 1 ? `${selectedIds.size} cards` : "card"}`}><Button icon="trash" onClick={deleteSelectedCards}/></Tooltip>
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
	const { columns, cardEntries, setColumns, ...rest } = props;
	// return null;
	return (
		<div className="scroll-container">
			<HTMLTable className="card-list" interactive={true}>
				<thead>
					<tr>
						{useMemo(() => columns.map((column, index) => (<CardListHeader
							key={column.field}
							setWidth={(value) => setColumnProperty(setColumns, index, "width", value)}
							{...column}
						/>)), [columns, setColumns])}
					</tr>
				</thead>
				<tbody>
					{cardEntries.map(cardEntry => (
						<CardListRow
							key={cardEntry[0].id}
							columns={columns}
							cardEntry={cardEntry}
							{...rest}
						/>
					))}
				</tbody>
			</HTMLTable>
		</div>
	);
}

export interface CardListHeaderProps {
	field: string,
	heading: string,
	/** width in pixels */
	width: number,
	setWidth: Dispatch<SetStateAction<number>>,
}

export function CardListHeader(props: CardListHeaderProps) {
	const { field, heading, width, setWidth } = props;

	return (
		<th
			style={{ minWidth: `${width}px`, width: `${width}px`, maxWidth: `${width}px` }}
			data-field={field}
		>
			{heading}
			<SizeHandle setWidth={setWidth}/>
		</th>
	);
}

export function SizeHandle({
	setWidth,
}: {
	setWidth: Dispatch<SetStateAction<number>>,
}) {
	const onPointerDown = useCallback<PointerEventHandler>(e => {
		let lastX = e.pageX;
		const move = (e: PointerEvent) => {
			const diff = e.pageX - lastX; // im scared of lastX changing beneath us if things if this gets called twice so we cache the value here
			setWidth(old => old + diff);
			lastX = e.pageX;
		};
		const up = () => {
			document.removeEventListener("pointermove", move);
			document.body.style.removeProperty("cursor");
		};
		document.addEventListener("pointermove", move);
		document.addEventListener("pointerup", up, { once: true });
		// document.body.style.setProperty("cursor", "col-resize", "important");
		e.currentTarget.setPointerCapture(e.pointerId);
	}, [setWidth]);
	return (
		<div className="size-handle" onPointerDown={onPointerDown}/>
	);
}

export interface CardListRowProps {
	columns: listColumn[],
	cardEntry: NodeEntry<Card>,
	activeId?: number,
	setActiveId: (card: number) => void,
	selectedIds: Set<number>,
	setSelectedIds: (cardsOrFunc: Set<number> | ((old: Set<number>) => Set<number>)) => void,
	exportCards?: (ids: Iterable<number>) => void,
	deleteCards?: (ids: Iterable<number>) => void,
}

export function CardListRow(props: CardListRowProps) {
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
					{columns.map(({ field, width }) => <CardListCell key={field} cardPath={path} field={field} width={width}/>)}
				</tr>
			)}
		</ContextMenu>
	);
}

export interface CardListCellProps extends EditableProps {
	cardPath: Path,
	field: string,
	width: number,
}

export function CardListCell(props: CardListCellProps) {
	const { cardPath, field, width, ...rest } = props;
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
					whiteSpace: "nowrap",
					// wordWrap: "break-word",
					minWidth: `${width}px`,
					width: `${width}px`,
					maxWidth: `${width}px`,
				}}
				readOnly={true}
				{...rest}
			/>
		</Slate>
	);
}
