import React, { MouseEvent, MouseEventHandler, ReactNode, useCallback, useEffect } from "react";
import { DocumentEditor } from "../slate";
import { useDocument } from "./DocumentContext";
import { useContextMenu } from "./ContextMenuContext";

export interface menu_option {
	name: string,
	handler: (event: MouseEvent<Element, globalThis.MouseEvent>, doc: DocumentEditor) => void,
}

export interface context_menu_data {
	position: [number, number],
	options: menu_option[],
}

export interface ContextMenuProps {
	position: [number, number],
	options: menu_option[],
}

export function ContextMenu(props: ContextMenuProps) {
	const { position, options } = props;
	const set_context_menu = useContextMenu();

	// get rid of menu if we click outside
	// this doesn't get rid of it if we click outside the window, is there a way to detect that maybe as focus loss?
	const outside_callback = useCallback<(e: globalThis.MouseEvent) => void>(e => {
		if (e.target instanceof Element && e.target.closest(".context_menu")) return; // don't get rid of menu if we click inside.
		set_context_menu(undefined);
	}, [set_context_menu]);
	useEffect(() => {
		window.addEventListener("mousedown", outside_callback);
		return () => window.removeEventListener("mousedown", outside_callback);
	}, [outside_callback]);

	return (
		<div className="context_menu" style={{ left: position[0], top: position[1] }}>
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
	const context_menu = useContextMenu();
	const onClick = useCallback<MouseEventHandler>(e => {
		handler(e, doc);
		context_menu(undefined);
	}, [handler, doc])
	return (
		<button onClick={onClick}>
			{children}
		</button>
	);
}
