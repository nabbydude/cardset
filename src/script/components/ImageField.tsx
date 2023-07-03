import React, { DragEvent, DragEventHandler, useCallback, useEffect, useMemo } from "react";
import { Editor, Node, Path, Transforms } from "slate";

import { firstMatchingElement, firstMatchingPath, } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { Card } from "./slate/Card";
import { Image, isImage } from "./slate/Image";
import { useImageStore } from "./contexts/ImageStoreContext";

export interface ImageFieldProps {
	cardPath: Path,
	field: string,
}

export function ImageField(props: ImageFieldProps) {
	const { cardPath, field } = props;
	const doc = useDocument();
	const imageStore = useImageStore();
	const card = Node.get(doc, cardPath) as Card;
	const pathRef = useMemo(() => {
		const fieldPath = firstMatchingPath(card, { type: "Field", name: field });
		if (!fieldPath) return;
		const fullPath = cardPath.concat(fieldPath);
		return Editor.pathRef(doc, fullPath);
	}, [doc, card.id]);

	// clean up old refs when card changes or this element unmounts
	useEffect(() => {
		return () => { pathRef?.unref(); };
	}, [pathRef]);

	const image = pathRef?.current ? firstMatchingElement<Image>(Node.get(doc, pathRef.current), { type: "Image" }) : undefined;

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
		if (pathRef?.current) {
			imageStore.set(card.id, file);
			Transforms.setNodes(doc, { src: card.id }, { at: pathRef.current, match: node => isImage(node) });
		}
	}, [doc, pathRef]);

	const src = (typeof image?.src === "number" ? imageStore.get(image.src)?.url : image?.src) ?? "";

	return (
		<img className="image" onDragOver={onDragOver} onDrop={onDrop} src={src}/>
	);
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
}
