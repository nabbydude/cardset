import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";
import React, { DragEvent, useContext, useMemo } from "react";
import { card } from "../card";
import { image_enum_control } from "../control";
import { apply_and_write } from "../history";
import { image } from "../image";
import { image_property } from "../property";
import { useToastedCallback } from "../toaster";
import { HistoryContext } from "./contexts/HistoryContext";
import { usePropertyValue } from "./hooks/usePropertyValue";

export interface option {
	id: string,
	label: string,
	image: image,
}

export interface ImageEnumControlProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	card: card,
	control: image_enum_control,
	readOnly?: boolean,
}

export function ImageEnumControl(props: ImageEnumControlProps) {
	const { card, control, readOnly = false, ...rest } = props;
	const property = card.properties.get(control.property_id) as image_property;
	const history = useContext(HistoryContext);

	const value = usePropertyValue(property);

	const change_option = useToastedCallback((index: number) => {
		const option = control.options[index];
		apply_and_write(
			history,
			{ type: "card_control", card, control },
			{ type: "change_property_value", property, old_value: property.value, new_value: option.value }
		)
	}, [history, card, control]);

	const src = value?.url ?? "";

	const items = useMemo(() => control.options.map(({ id, label }, index) => (<MenuItem key={id} text={label} onClick={() => change_option(index)}/>)), [control, change_option]);
	return (
		<ContextMenu content={<Menu>{items}</Menu>} disabled={readOnly}>
			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
				<div className={className} ref={ref}>
					{popover}
					<img
						data-control-id={control.id}
						src={src}
						onClick={onContextMenu}
						onDragStart={onDragStart}
						tabIndex={0}
						{...rest}
					/>
				</div>
			)}
		</ContextMenu>
	);
}

function onDragStart(e: DragEvent<HTMLImageElement>) {
	e.preventDefault();
}
