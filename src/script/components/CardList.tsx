import React, { Dispatch, MouseEventHandler, PointerEventHandler, SetStateAction, useCallback, useContext, useMemo } from "react";

import { EditableProps, renderElement, renderLeaf } from "../slate";
import { Slate } from "slate-react";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { Button, ContextMenu, ContextMenuChildrenProps, Divider, HTMLTable, Menu, MenuItem, Tooltip } from "@blueprintjs/core";
import { card, createTestCard } from "../card";
import { add_card, delete_cards } from "../project";
import { ProjectContext } from "./contexts/ProjectContext";
import { HistoryContext } from "./contexts/HistoryContext";
import { useCardTextControlEditor } from "./hooks/useTextControlEditor";
import { property } from "../property";
import { card_list } from "../card_list";
import { useCardListCards } from "./hooks/useCardListCards";

export interface listColumn {
	property_id: string,
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
	card_list: card_list,
	selectedCards: Set<card>,
	activeCard?: card,
	setColumns: Dispatch<SetStateAction<listColumn[]>>,
	setSelectedCards: Dispatch<SetStateAction<Set<card>>>,
	setActiveCard: Dispatch<SetStateAction<card | undefined>>,
	exportCards?: (ids: Iterable<card>) => void,
}

export function ControllableCardList(props: ControllableCardListProps) {
	const { ...rest } = props;
	const { selectedCards, setActiveCard, setSelectedCards, activeCard } = rest;

	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);

	const addCardAndFocus = useCallback(() => {
		const card = createTestCard("New Card", "colorless");
		add_card(
			project,
			history,
			{ type: "none" },
			card
		);
		setActiveCard(card);
		setSelectedCards(new Set([card]));
	}, [setActiveCard]);

	const deleteSelectedCards = useCallback(() => {
		delete_cards(
			project,
			history,
			{ type: "none" },
			selectedCards
		);
		if (selectedCards.has(activeCard!)) setActiveCard(undefined);
		setSelectedCards(new Set());
	}, [activeCard, selectedCards, setActiveCard, setSelectedCards]);

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
				{selectedCards.size > 0 ? (<>
					<Divider/>
					<Tooltip content={`Delete ${selectedCards.size > 1 ? `${selectedCards.size} cards` : "card"}`}><Button icon="trash" onClick={deleteSelectedCards}/></Tooltip>
					<Divider/>
					<div className="info">
						{selectedCards.size} card{selectedCards.size === 1 ? "" : "s"} selected
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
	const { columns, card_list, setColumns, ...rest } = props;
	const cards = useCardListCards(card_list);
	return (
		<div className="scroll-container">
			<HTMLTable className="card-list" interactive={true}>
				<thead>
					<tr>
						{useMemo(() => columns.map((column, index) => (<CardListHeader
							key={column.property_id}
							setWidth={(value) => setColumnProperty(setColumns, index, "width", value)}
							{...column}
						/>)), [columns, setColumns])}
					</tr>
				</thead>
				<tbody>
					{[...cards].map(card => (
						<CardListRow
							key={card.id}
							columns={columns}
							card={card}
							{...rest}
						/>
					))}
				</tbody>
			</HTMLTable>
		</div>
	);
}

export interface CardListHeaderProps {
	property_id: string,
	heading: string,
	/** width in pixels */
	width: number,
	setWidth: Dispatch<SetStateAction<number>>,
}

export function CardListHeader(props: CardListHeaderProps) {
	const { property_id, heading, width, setWidth } = props;

	return (
		<th
			style={{ minWidth: `${width}px`, width: `${width}px`, maxWidth: `${width}px` }}
			data-field={property_id}
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
	card: card,
	activeCard?: card,
	setActiveCard: (card: card) => void,
	selectedCards: Set<card>,
	setSelectedCards: (cardsOrFunc: Set<card> | ((old: Set<card>) => Set<card>)) => void,
	exportCards?: (cards: Iterable<card>) => void,
	deleteCards?: (cards: Iterable<card>) => void,
}

export function CardListRow(props: CardListRowProps) {
	const { columns, card, activeCard, setActiveCard, selectedCards, setSelectedCards, exportCards, deleteCards } = props;
	const active = activeCard === card;
	const selected = selectedCards.has(card);

	const onClick = useCallback((e => {
		if (e.ctrlKey) {
			setSelectedCards(old => new Set(old.delete(card) ? old : old.add(card))); // delete entry if it exists and copy set (immutability is v inefficient), or if it doesn't exist, add it and copy set
		} else {
			setSelectedCards(new Set([card]));
		}
		setActiveCard(card);
	}) as MouseEventHandler<HTMLTableRowElement>, [card, setActiveCard, setSelectedCards]);

	const exportSelectedCards = useCallback(() => exportCards?.(selectedCards), [exportCards, selectedCards]);
	const deleteSelectedCards = useCallback(() => deleteCards?.(selectedCards), [deleteCards, selectedCards]);

	const classList: string[] = [];
	if (selected) classList.push("selected");
	if (active) classList.push("active");
	return (
		<ContextMenu
			disabled={!(exportCards || deleteCards)}
			content={
				<Menu>
					{exportCards && <MenuItem text={`Export ${selectedCards.size > 1 ? `${selectedCards.size} cards` : "card"}`} icon="export" onClick={exportSelectedCards}/>}
					{exportCards && deleteCards && <Divider/>}
					{deleteCards && <MenuItem text={`Delete ${selectedCards.size > 1 ? `${selectedCards.size} cards` : "card"}`} icon="trash" intent="danger" onClick={deleteSelectedCards}/>}
				</Menu>
			}
		>
			{({ className, onContextMenu, ref, popover }: ContextMenuChildrenProps) => (
				<tr
					onClick={onClick}
					className={[...classList, className].join(" ")}
					onContextMenu={useCallback<MouseEventHandler<HTMLTableRowElement>>(e => {
						if (!selected) {
							setSelectedCards(new Set([card]));
							setActiveCard(card);
						}
						onContextMenu(e);
					}, [selected, onContextMenu])}
					ref={ref}
				>
					{popover}{/* this is a portal, so it doesnt break table schema */}
					{columns.map(({ property_id, width }) => <CardListCell key={property_id} card={card} property={card.properties[property_id]} controlId={`list_cell#${property_id}`} width={width}/>)}
				</tr>
			)}
		</ContextMenu>
	);
}

export interface CardListCellProps extends Omit<EditableProps, "property"> {
	card: card,
	property: property,
	controlId: string,
	width: number,
}

export function CardListCell(props: CardListCellProps) {
	const { card, property, controlId: controlCard, width, ...rest } = props;
	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);
	// const doc = useDocument();
	// const [editor] = useState(createCardTextControlEditor);
	// useViewOfMatchingNode(editor, doc, cardPath, { type: "Field", name: field }, true);

	if (property.type !== "text") throw Error(`property "${property.id}" is not text property`)
	const editor = useCardTextControlEditor(card, controlCard, property)

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
