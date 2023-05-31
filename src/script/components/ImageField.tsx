import React, { DragEvent, DragEventHandler, KeyboardEvent, useCallback, useEffect, useMemo } from "react";
import { Editor, Node, Path, Transforms } from "slate";

import { first_matching_element, first_matching_path, } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { Card } from "./slate/Card";
import { Image, isImage } from "./slate/Image";
import { frame_urls } from "../card_frame";

export interface ImageFieldProps {
	card_path: Path,
	field: string,
}

export function ImageField(props: ImageFieldProps) {
	const { card_path, field } = props;
	const doc = useDocument();
	const card = Node.get(doc, card_path) as Card;
	const pathref = useMemo(() => {
		const field_path = first_matching_path(card, { type: "Field", name: field });
		if (!field_path) return;
		const full_path = card_path.concat(field_path);
		return Editor.pathRef(doc, full_path);
	}, [doc, card.id]);

	// clean up old refs when card changes or this element unmounts
	useEffect(() => {
		return () => { pathref?.unref(); };
	}, [pathref]);

	const image = pathref?.current ? first_matching_element<Image>(Node.get(doc, pathref.current), { type: "Image" }) : undefined;

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
		if (pathref?.current) Transforms.setNodes(doc, { src: URL.createObjectURL(file) }, { at: pathref.current, match: node => isImage(node) });
	}, [doc, pathref]);

	return (
		<img className="image" onDragOver={onDragOver} onDrop={onDrop} src={image?.src ?? ""}/>
	)
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
}
