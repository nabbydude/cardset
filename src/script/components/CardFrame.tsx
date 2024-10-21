import React, { useCallback, useContext } from "react";
import { frameUrls } from "../assets";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";
import { image_property } from "../property";
import { card } from "../card";
import { write_operation_to_history } from "../history";
import { HistoryContext } from "./contexts/HistoryContext";

export interface CardFrameProps {
	card: card,
	controlId: string,
	propertyId: string,
	readOnly?: boolean,
}

export function CardFrame(props: CardFrameProps) {
	const { card, controlId, propertyId, readOnly = false } = props;
	// const imageStore = useContext(ImageStoreContext);
	const history = useContext(HistoryContext);

	const changeColor = useCallback((color: keyof typeof frameUrls) => {
		const old_image = (card.properties[propertyId] as image_property).src;
		(card.properties[propertyId] as image_property).src = frameUrls[color];
		write_operation_to_history(
			history,
			{ type: "none" }, // TODO: real focus
			{ type: "image_property", card_id: card.id, property_id: propertyId, old_image, new_image: frameUrls[color] }
		)
	}, [card, propertyId]);

	const src = (card.properties[propertyId] as image_property).src ?? "";
	// const src_url = useMemo(() => src instanceof Blob ? URL.createObjectURL(src) : src, [src]); // TODO: this leaks. we should manage this better

	return (
		<ContextMenu
			content={
				<Menu>
					<MenuItem text="White"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("white"       ), [changeColor])} />
					<MenuItem text="Blue"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("blue"        ), [changeColor])} />
					<MenuItem text="Black"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("black"       ), [changeColor])} />
					<MenuItem text="Red"          onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("red"         ), [changeColor])} />
					<MenuItem text="Green"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("green"       ), [changeColor])} />
					<MenuItem text="Multicolored" onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("multicolored"), [changeColor])} />
					<MenuItem text="Colorless"    onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("colorless"   ), [changeColor])} />
					<MenuItem text="Artifact"     onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("artifact"    ), [changeColor])} />
					<MenuItem text="Land"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("land"        ), [changeColor])} />
				</Menu>
			}
			disabled={readOnly}
		>
			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
				<div
					className={className}
					ref={ref}
				>
					{popover}
					<img
						className="frame"
						src={src}
						onClick={onContextMenu}
					/>
				</div>
			)}
		</ContextMenu>
	);
}
