import React, { DragEvent, DragEventHandler, useCallback, useContext } from "react";
import { ImageStoreContext, imageStoreHandle } from "./contexts/ImageStoreContext";
import { NonIdealState } from "@blueprintjs/core";
import { card } from "../card";
import { image_property } from "../property";
import { HistoryContext } from "./contexts/HistoryContext";
import { write_operation_to_history } from "../history";

export interface ImageControlProps {
	card: card,
	controlId: string,
	propertyId: string,
}

export function ImageControl(props: ImageControlProps) {
	const { card, controlId, propertyId } = props;
	const imageStore = useContext(ImageStoreContext);
	const history = useContext(HistoryContext);
	// const pathRef = useMemo(() => {
	// 	const propertyPath = firstMatchingPath(card, { type: "Control", name: property });
	// 	if (!propertyPath) return;
	// 	const fullPath = path.concat(propertyPath);
	// 	return Editor.pathRef(doc, fullPath);
	// }, [doc, card.id]);

	// // clean up old refs when card changes or this element unmounts
	// useEffect(() => {
	// 	return () => { pathRef?.unref(); };
	// }, [pathRef]);

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
		const store_id = `${card.id}_${Date.now()}`;
		imageStore.set(store_id, file);
		const old_image = (card.properties[propertyId] as image_property).src;
		const new_image = `store://${store_id}`;
		(card.properties[propertyId] as image_property).src = new_image;
		write_operation_to_history(
			history,
			{ type: "none" }, // todo
			{ type: "image_property", card_id: card.id, property_id: propertyId, new_image, old_image }
		);
	}, [card.id, propertyId, imageStore]);

	const src = getTrueImageUrl(imageStore, (card.properties[propertyId] as image_property).src ?? "");

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

function getTrueImageUrl(image_store: imageStoreHandle, src: string): string {
	// let src = (card.properties[property] as image_property).src ?? "";
	let m = /^store:\/\/(.*)$/.exec(src);
	if (m) src = image_store.get(m[1])?.url ?? "";
	return src;
}
