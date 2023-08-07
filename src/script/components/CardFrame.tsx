import React, { useCallback } from "react";
import { NodeEntry } from "slate";
import { Card } from "./slate/Card";
import { firstMatchingEntry } from "../slate";
import { Field } from "./slate/Field";
import { Image } from "./slate/Image";
import { useImageStore } from "./contexts/ImageStoreContext";
import { useDocument } from "./contexts/DocumentContext";
import { frameUrls } from "../assets";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";

export interface CardFrameProps {
	cardEntry: NodeEntry<Card>,
	field: string,
	readOnly?: boolean,
}

export function CardFrame(props: CardFrameProps) {
	const { cardEntry, field, readOnly = false } = props;
	const [card, path] = cardEntry;
	const doc = useDocument();
	const imageStore = useImageStore();

	const [fieldElement, fieldPath] = firstMatchingEntry<Field>(card, { type: "Field", name: field }) ?? [undefined, []] as const;
	const [image, imagePath] = (fieldElement && firstMatchingEntry<Image>(fieldElement, { type: "Image" })) ?? [undefined, []] as const;
	const fullPath = path.concat(fieldPath, imagePath);
	const changeColor = useCallback((color: keyof typeof frameUrls) => {
		doc.setNodes({ src: frameUrls[color] }, { at: fullPath });
	}, [doc, fullPath.join(",")]);

	const src = (typeof image?.src === "number" ? imageStore.get(image.src)?.url : image?.src) ?? "";
	return (
		<ContextMenu
			content={
				<Menu>
					<MenuItem text="White"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("white"       ), [changeColor])} />
					<MenuItem text="Blue"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("blue"        ), [changeColor])} />
					<MenuItem text="Black"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("black"       ), [changeColor])} />
					<MenuItem text="Red"          onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("red"         ), [changeColor])} />
					<MenuItem text="Green"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("green"       ), [changeColor])} />
					<MenuItem text="Multicolored" onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("multicolored"), [changeColor])} />
					<MenuItem text="Colorless"    onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("colorless"   ), [changeColor])} />
					<MenuItem text="Artifact"     onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("artifact"    ), [changeColor])} />
					<MenuItem text="Land"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(()=> changeColor("land"        ), [changeColor])} />
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
						onClick={onContextMenu} // this is an unconventional use so I hope it works without snag (spoiler alert clicking the menu resets it without e.stopPropagation() because its its own child, todo:)
					/>
				</div>
			)}
		</ContextMenu>
	);
}
