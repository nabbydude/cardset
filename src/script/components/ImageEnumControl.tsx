import React, { useCallback, useContext, useMemo } from "react";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";
import { image_property } from "../property";
import { card } from "../card";
import { apply_and_write } from "../history";
import { HistoryContext } from "./contexts/HistoryContext";
import { image } from "../image";
import { usePropertyValue } from "./hooks/usePropertyValue";

export interface option {
	id: string,
	label: string,
	image: image,
}

export interface ImageEnumControlProps {
	card: card,
	controlId: string,
	property: image_property,
	options: option[],
	readOnly?: boolean,
}

export function ImageEnumControl(props: ImageEnumControlProps) {
	const { card, controlId, property, options, readOnly = false } = props;
	const history = useContext(HistoryContext);

	const value = usePropertyValue(property);

	const change_option = useCallback((index: number) => {
		const option = options[index];
		apply_and_write(
			history,
			{ type: "none" }, // TODO: real focus
			{ type: "change_property_value", property, old_value: property.value, new_value: option.image }
		)
	}, [history, options, card, property]);

	const src = value?.url ?? "";

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
