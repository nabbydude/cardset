import React, { DragEvent, DragEventHandler, useCallback, useContext } from "react";
import { NonIdealState } from "@blueprintjs/core";
import { card } from "../card";
import { image_property } from "../property";
import { HistoryContext } from "./contexts/HistoryContext";
import { apply_and_write } from "../history";
import { load_image_from_blob } from "../image";
import { usePropertyValue } from "./hooks/usePropertyValue";

export interface ImageControlProps {
	card: card,
	controlId: string,
	property: image_property,
}

export function ImageControl(props: ImageControlProps) {
	const { card, controlId, property } = props;
	const history = useContext(HistoryContext);
	const value = usePropertyValue(property);

	const onDrop = useCallback<DragEventHandler>(e => {
		e.preventDefault();
		let file: File;
		if (e.dataTransfer.items) {
			if (e.dataTransfer.items.length !== 1) return;
			const item = e.dataTransfer.items[0];
			if (item.kind !== "file") return;
			file = item.getAsFile()!;
		} else {
			if (e.dataTransfer.files.length !== 1) return;
			file = e.dataTransfer.items[0];
		}
		if (!file.type.startsWith("image/")) return;
		const old_value = property.value;
		const new_value = load_image_from_blob(file);
		apply_and_write(
			history,
			{ type: "none" }, // todo
			{ type: "change_property_value", property, new_value, old_value }
		);
	}, [card.id, property]);

	const src = property.value?.url ?? "";

	return src ? (
		<img className="image" onDragOver={onDragOver} onDrop={onDrop} src={src}/>
	) : (
		<div className="image" data-no-render onDragOver={onDragOver} onDrop={onDrop}>
			<NonIdealState
				title="No Image"
				description="Drag and drop an image to add one."
				// action={<Button icon="plus" onClick={addCard}>Create a card</Button>}
			/>
		</div>
	);
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
}
