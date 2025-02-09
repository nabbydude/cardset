import React, { useCallback, useContext } from "react";
import { frame_images } from "../assets";
import { ContextMenu, ContextMenuChildrenProps, Menu, MenuItem } from "@blueprintjs/core";
import { image_property } from "../property";
import { card } from "../card";
import { apply_and_write } from "../history";
import { HistoryContext } from "./contexts/HistoryContext";
import { dumb_load_image_from_url } from "../image";
import { ImageEnumControl, option } from "./ImageEnumControl";

export interface CardFrameProps {
	card: card,
	controlId: string,
	property: image_property,
	readOnly?: boolean,
}

// export function CardFrame(props: CardFrameProps) {
// 	const { card, controlId, property, readOnly = false } = props;
// 	// const imageStore = useContext(ImageStoreContext);
// 	const history = useContext(HistoryContext);

// 	const changeColor = useCallback((color: keyof typeof frameUrls) => {
// 		const old_value = property.value;
// 		const new_value = dumb_load_image_from_url(frameUrls[color]); // todo: fix jank. this creates a new `image` object and blob-url each time a change is made (bad). should have a better solution for frame images eventually--image properties save seperately per card atm
// 		apply_and_write(
// 			history,
// 			{ type: "none" }, // TODO: real focus
// 			{ type: "change_property_value", property, old_value, new_value },
// 		)
// 	}, [card, property]);

// 	const src = property.value?.url ?? "";

// 	return (
// 		<ContextMenu
// 			content={
// 				<Menu>
// 					<MenuItem text="White"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("white"       ), [changeColor])} />
// 					<MenuItem text="Blue"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("blue"        ), [changeColor])} />
// 					<MenuItem text="Black"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("black"       ), [changeColor])} />
// 					<MenuItem text="Red"          onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("red"         ), [changeColor])} />
// 					<MenuItem text="Green"        onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("green"       ), [changeColor])} />
// 					<MenuItem text="Multicolored" onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("multicolored"), [changeColor])} />
// 					<MenuItem text="Colorless"    onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("colorless"   ), [changeColor])} />
// 					<MenuItem text="Artifact"     onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("artifact"    ), [changeColor])} />
// 					<MenuItem text="Land"         onClick={useCallback<React.MouseEventHandler<HTMLAnchorElement>>(() => changeColor("land"        ), [changeColor])} />
// 				</Menu>
// 			}
// 			disabled={readOnly}
// 		>
// 			{({ className, onContextMenu, ref, popover}: ContextMenuChildrenProps) => (
// 				<div
// 					className={className}
// 					ref={ref}
// 				>
// 					{popover}
// 					<img
// 						className="frame"
// 						src={src}
// 						onClick={onContextMenu}
// 					/>
// 				</div>
// 			)}
// 		</ContextMenu>
// 	);
// }

export function CardFrame(props: CardFrameProps) {
	// const { card, propertyId, checkPropertyId: check_property, readOnly = false } = props;

	const options: option[] = [
		{ id: "white"       , label: "White"        , image: frame_images["white"       ] },
		{ id: "blue"        , label: "Blue"         , image: frame_images["blue"        ] },
		{ id: "black"       , label: "Black"        , image: frame_images["black"       ] },
		{ id: "red"         , label: "Red"          , image: frame_images["red"         ] },
		{ id: "green"       , label: "Green"        , image: frame_images["green"       ] },
		{ id: "multicolored", label: "Multicolored" , image: frame_images["multicolored"] },
		{ id: "colorless"   , label: "Colorless"    , image: frame_images["colorless"   ] },
		{ id: "artifact"    , label: "Artifact"     , image: frame_images["artifact"    ] },
	];

	return (
		<ImageEnumControl options={options} {...props}/>
	);
}
