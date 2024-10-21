import React, { useCallback, useContext, useMemo, useState } from "react";
import { frameUrls } from "../assets";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";
import { image_property } from "../property";
import { card } from "../card";
import { write_operation_to_history } from "../history";
import { HistoryContext } from "./contexts/HistoryContext";

export interface option {
	id: string,
	label: string,
	image: string,
}

export interface ImageEnumControlProps {
	card: card,
	controlId: string,
	propertyId: string,
	options: option[],
	readOnly?: boolean,
}

export function ImageEnumControl(props: ImageEnumControlProps) {
	const { card, controlId, propertyId, options, readOnly = false } = props;
	// const imageStore = useContext(ImageStoreContext);
	const history = useContext(HistoryContext);
	const [dummy, setDummy] = useState(1);

	const change_option = useCallback((index: number) => {
		const option = options[index];
		const old_image = (card.properties[propertyId] as image_property).src;
		const new_image = option.image;
		(card.properties[propertyId] as image_property).src = new_image;
		setDummy(old => old + 1);
		write_operation_to_history(
			history,
			{ type: "none" }, // TODO: real focus
			{ type: "image_property", card_id: card.id, property_id: propertyId, old_image, new_image }
		)
	}, [card, propertyId]);

	const src = (card.properties[propertyId] as image_property).src ?? ""; // TODO: support store images

	const items = useMemo(() => options.map(({ id, label }, index) => (<MenuItem key={id} text={label} onClick={() => change_option(index)}/>)), [options, change_option])
	return (
		<ContextMenu content={<Menu>{items}</Menu>} disabled={readOnly}>
			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
				<div
					className={className}
					ref={ref}
				>
					{popover}
					<img
						className="frame"
						data-control-id={controlId}
						src={src}
						onClick={onContextMenu}
					/>
				</div>
			)}
		</ContextMenu>
	);
}
