import React, { useCallback } from "react";
import { Editor, Element } from "slate";
import { firstMatchingEntry } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { CardFrameProps } from "./CardFrame";
import { Field } from "./slate/Field";
import { useImageStore } from "./contexts/ImageStoreContext";
import { ptBoxUrls } from "../colorAssets";
import { Image } from "./slate/Image";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PowerToughnessBackgroundProps extends CardFrameProps {
	checkField: string;
}

export function PowerToughnessBackground(props: PowerToughnessBackgroundProps) {
	const { cardEntry, field, checkField } = props;
	const [card, path] = cardEntry;
	const doc = useDocument();
	const imageStore = useImageStore();

	const [fieldElement, fieldPath] = firstMatchingEntry<Field>(card, { type: "Field", name: field }) ?? [undefined, []] as const;
	const [image, imagePath] = (fieldElement && firstMatchingEntry<Image>(fieldElement, { type: "Image" })) ?? [undefined, []] as const;
	const fullPath = path.concat(fieldPath, imagePath);
	const changeColor = useCallback((color: keyof typeof ptBoxUrls) => {
		doc.setNodes({ src: ptBoxUrls[color] }, { at: fullPath });
	}, [doc, fullPath.join(",")]);

	const menu = (
		<Menu>
			<MenuItem text="White"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("white"       ), [changeColor])} />
			<MenuItem text="Blue"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("blue"        ), [changeColor])} />
			<MenuItem text="Black"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("black"       ), [changeColor])} />
			<MenuItem text="Red"          onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("red"         ), [changeColor])} />
			<MenuItem text="Green"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("green"       ), [changeColor])} />
			<MenuItem text="Multicolored" onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("multicolored"), [changeColor])} />
			<MenuItem text="Colorless"    onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("colorless"   ), [changeColor])} />
			<MenuItem text="Artifact"     onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("artifact"    ), [changeColor])} />
		</Menu>
	);

	const [checkFieldElement] = firstMatchingEntry<Field>(card, { type: "Field", name: checkField }) ?? [undefined, []];
	const isPtEmpty = !checkFieldElement || checkFieldElement.children.length === 1 && Editor.isEmpty(doc, checkFieldElement.children[0] as Element);
	if (isPtEmpty) return null;

	const src = (typeof image?.src === "number" ? imageStore.get(image.src)?.url : image?.src) ?? "";
	return (
		<ContextMenu content={menu}>
			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
				<div
					className={className}
					ref={ref}
				>
					{popover}
					<img
						className="pt-box"
						src={src}
						onClick={onContextMenu} // this is an unconventional use so I hope it works without snag (spoiler alert clicking the menu resets it without e.stopPropagation() because its its own child, todo:)
					/>
				</div>
			)}
		</ContextMenu>
	);
}
