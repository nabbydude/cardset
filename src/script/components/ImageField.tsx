import React, { DragEvent, DragEventHandler, KeyboardEvent, useCallback, useEffect, useMemo, useRef } from "react";
import { Editor, Node, Path, Transforms } from "slate";

import { first_matching_element, first_matching_path, } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { Card } from "./slate/Card";
import { Image, isImage } from "./slate/Image";
import { frame_urls } from "../color_assets";
import { useImageStore } from "./contexts/ImageStoreContext";

export interface ImageFieldProps {
	card_path: Path,
	field: string,
}

export function ImageField(props: ImageFieldProps) {
	const { card_path, field } = props;
	const doc = useDocument();
	const image_store = useImageStore();
	const card = Node.get(doc, card_path) as Card;
	const path_ref = useMemo(() => {
		const field_path = first_matching_path(card, { type: "Field", name: field });
		if (!field_path) return;
		const full_path = card_path.concat(field_path);
		return Editor.pathRef(doc, full_path);
	}, [doc, card.id]);

	// clean up old refs when card changes or this element unmounts
	useEffect(() => {
		return () => { path_ref?.unref(); };
	}, [path_ref]);

	const image = path_ref?.current ? first_matching_element<Image>(Node.get(doc, path_ref.current), { type: "Image" }) : undefined;

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
		if (path_ref?.current) {
			image_store.set(card.id, file);
			Transforms.setNodes(doc, { src: card.id }, { at: path_ref.current, match: node => isImage(node) });
		}
	}, [doc, path_ref]);

	const src = (typeof image?.src === "number" ? image_store.get(image.src)?.url : image?.src) ?? "";

	return (
		<img className="image" onDragOver={onDragOver} onDrop={onDrop} src={src}/>
	)
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
}
