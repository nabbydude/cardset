import { Button, ContextMenu, ContextMenuChildrenProps, Divider, HTMLTable, Menu, MenuItem, Tooltip } from "@blueprintjs/core";
import React, { Dispatch, MouseEvent, MouseEventHandler, PointerEventHandler, SetStateAction, useContext, useMemo } from "react";
import { Slate } from "slate-react";
import { card, createTestCard } from "../card";
import { card_list } from "../card_list";
import { text_control } from "../control";
import { add_card, delete_cards } from "../project";
import { EditableProps } from "../slate";
import { useToastedCallback } from "../toaster";
import { HistoryContext } from "./contexts/HistoryContext";
import { ProjectContext } from "./contexts/ProjectContext";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { useCardListCards } from "./hooks/useCardListCards";
import { useTextControlEditor } from "./hooks/useTextControlEditor";
import { RenderElement } from "./slate/RenderElement";
import { RenderLeaf } from "./slate/RenderLeaf";

export interface listColumn {
	control: text_control,
	label: string,
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
	const { activeCard, selectedCards, setActiveCard, setSelectedCards, ...rest } = props;

	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);

	const onAddCardClick = useToastedCallback(() => {
		// add card and focus it
		const card = createTestCard("New Card", "colorless");
		add_card(
			project,
			history,
			{ type: "none" },
			card
		);
		setActiveCard(card);
		setSelectedCards(new Set([card]));
	}, [project, history]);

	const onDeleteCardClick = useToastedCallback(() => {
		delete_cards(
			project,
			history,
			{ type: "none" },
			selectedCards
		);
	}, [project, history, selectedCards]);



	return (
		<div className="controllable-card-list">
			<div className="controls">
				<Tooltip content="Add Card"><Button icon="plus" onClick={onAddCardClick}/></Tooltip>
				{selectedCards.size > 0 ? (<>
					<Divider/>
					<Tooltip content={`Delete ${selectedCards.size > 1 ? `${selectedCards.size} cards` : "card"}`}><Button icon="trash" onClick={onDeleteCardClick}/></Tooltip>
					<Divider/>
					<div className="info">
						{selectedCards.size} card{selectedCards.size === 1 ? "" : "s"} selected
					</div>
				</> 
				) : (
					undefined
				)}

			</div>

			<CardList
				activeCard={activeCard}
				selectedCards={selectedCards}
				setActiveCard={setActiveCard}
				setSelectedCards={setSelectedCards}
				{...rest}
			/>
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
							key={column.control.property_id}
							column={column}
							setWidth={(value) => setColumnProperty(setColumns, index, "width", value)}
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
	column: listColumn
	setWidth: Dispatch<SetStateAction<number>>,
}

export function CardListHeader(props: CardListHeaderProps) {
	const { column, setWidth } = props;
	const { control, label, width } = column;
	const { property_id } = control;

	return (
		<th
			style={{ minWidth: `${width}px`, width: `${width}px`, maxWidth: `${width}px` }}
			data-property={property_id}
		>
			{label}
			<SizeHandle setWidth={setWidth}/>
		</th>
	);
}

export function SizeHandle({
	setWidth,
}: {
	setWidth: Dispatch<SetStateAction<number>>,
}) {
	const onPointerDown = useToastedCallback<PointerEventHandler>(e => {
		let lastX = e.pageX;
		const move = (e: PointerEvent) => {
			const diff = e.pageX - lastX; // im scared of lastX changing beneath us if things if this gets called twice so we cache the value here
			setWidth(old => old + diff);
			lastX = e.pageX;
		};
		const up = () => {
			document.removeEventListener("pointermove", move);
		};
		document.addEventListener("pointermove", move);
		document.addEventListener("pointerup", up, { once: true });
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

function onPointerDown(e: MouseEvent<HTMLTableRowElement>) {
	if (e.target instanceof HTMLElement && e.target.classList.contains("bp5-context-menu-backdrop")) return; // clicking out of context menu
	e.preventDefault();
};

export function CardListRow(props: CardListRowProps) {
	const { columns, card, activeCard, setActiveCard, selectedCards, setSelectedCards, exportCards, deleteCards } = props;
	const active = activeCard === card;
	const selected = selectedCards.has(card);

	const onClick = useToastedCallback<MouseEventHandler<HTMLTableRowElement>>(e => {
		if (e.ctrlKey) {
			setSelectedCards(old => new Set(old.delete(card) ? old : old.add(card))); // delete entry if it exists and copy set (immutability is v inefficient), or if it doesn't exist, add it and copy set
		} else {
			setSelectedCards(new Set([card]));
		}
		setActiveCard(card);
	}, [card, setActiveCard, setSelectedCards]);

	const exportSelectedCards = useToastedCallback(() => exportCards?.(selectedCards), [exportCards, selectedCards]);
	const deleteSelectedCards = useToastedCallback(() => deleteCards?.(selectedCards), [deleteCards, selectedCards]);

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
					onPointerDown={onPointerDown}
					className={[...classList, className].join(" ")}
					onContextMenu={useToastedCallback<MouseEventHandler<HTMLTableRowElement>>(e => {
						if (!selected) {
							setSelectedCards(new Set([card]));
							setActiveCard(card);
						}
						onContextMenu(e);
					}, [selected, onContextMenu])}
					ref={ref}
				>
					{popover}{/* this is a portal, so it doesnt break table schema */}
					{columns.map(({ control, width }) => <CardListCell key={control.id} card={card} control={control} width={width}/>)}
				</tr>
			)}
		</ContextMenu>
	);
}

export interface CardListCellProps extends Omit<EditableProps, "property"> {
	card: card,
	control: text_control,
	width: number,
}

export function CardListCell(props: CardListCellProps) {
	const { card, control, width, ...rest } = props;
	const editor = useTextControlEditor(card, control);

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				as="td"
				renderElement={RenderElement}
				renderLeaf={RenderLeaf}
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
