import React, { MouseEvent, MouseEventHandler, ReactNode, useCallback, useEffect } from "react";
import { DocumentEditor } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { useContextMenu } from "./contexts/ContextMenuContext";

export interface menuOption {
	name: string,
	handler: (event: MouseEvent<Element, globalThis.MouseEvent>, doc: DocumentEditor) => void,
}

export interface contextMenuData {
	position: [number, number],
	options: menuOption[],
}

export interface ContextMenuProps {
	position: [number, number],
	options: menuOption[],
}

export function ContextMenu(props: ContextMenuProps) {
	const { position, options } = props;
	const setContextMenu = useContextMenu();

	// get rid of menu if we click outside
	// this doesn't get rid of it if we click outside the window, is there a way to detect that maybe as focus loss?
	const outsideCallback = useCallback<(e: globalThis.MouseEvent) => void>(e => {
		if (e.target instanceof Element && e.target.closest(".contextMenu")) return; // don't get rid of menu if we click inside.
		setContextMenu(undefined);
	}, [setContextMenu]);
	useEffect(() => {
		window.addEventListener("mousedown", outsideCallback);
		return () => window.removeEventListener("mousedown", outsideCallback);
	}, [outsideCallback]);

	return (
		<div className="context-menu" style={{ left: position[0], top: position[1] }}>
			{options.map(({ name, handler })  => (<ContextMenuOption key={name} handler={handler}>{name}</ContextMenuOption>))}
		</div>
	);
}

export interface ContextMenuOptionProps {
	handler: (event: MouseEvent<Element, globalThis.MouseEvent>, doc: DocumentEditor) => void,
	children: ReactNode,
}

export function ContextMenuOption(props: ContextMenuOptionProps) {
	const { handler, children } = props;
	const doc = useDocument();
	const contextMenu = useContextMenu();
	const onClick = useCallback<MouseEventHandler>(e => {
		handler(e, doc);
		contextMenu(undefined);
	}, [handler, doc]);
	return (
		<button onClick={onClick}>
			{children}
		</button>
	);
}
