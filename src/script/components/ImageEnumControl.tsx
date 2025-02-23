import React, { useCallback, useContext, useMemo } from "react";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem, Props } from "@blueprintjs/core";
import { image_property } from "../property";
import { card } from "../card";
import { apply_and_write } from "../history";
import { HistoryContext } from "./contexts/HistoryContext";
import { image } from "../image";
import { usePropertyValue } from "./hooks/usePropertyValue";
import { image_enum_control } from "../control";

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

	const change_option = useCallback((index: number) => {
		const option = control.options[index];
		apply_and_write(
			history,
			{ type: "card_control", card, control },
			{ type: "change_property_value", property, old_value: property.value, new_value: option.value }
		)
	}, [history, card, control]);

	const src = value?.url ?? "";

	const items = useMemo(() => control.options.map(({ id, label }, index) => (<MenuItem key={id} text={label} onClick={() => change_option(index)}/>)), [control, change_option])
	return (
		<ContextMenu content={<Menu>{items}</Menu>} disabled={readOnly}>
			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
				<div
					className={className}
					ref={ref}
					>
					{popover}
					<img
						data-control-id={control.id}
						src={src}
						onClick={onContextMenu}
						tabIndex={0}
						{...rest}
					/>
				</div>
			)}
		</ContextMenu>
	);
}
