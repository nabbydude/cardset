import React, { useContext } from "react";
import { Editable, useSlate } from "slate-react";
import { FocusedEditorContext } from "./contexts/FocusedEditorContext";
import { EditableProps } from "../slate";
import { useToastedCallback } from "../toaster";

export function FocusSendingEditable(props: EditableProps) {
	const { onFocus, onBlur, ...rest } = props;
	const thisSlate = useSlate();
	const { setFocusedEditor, setCachedFocusedEditor } = useContext(FocusedEditorContext);

	const newOnFocus: React.FocusEventHandler<HTMLDivElement> = useToastedCallback(e => {
		setFocusedEditor(thisSlate);
		setCachedFocusedEditor(thisSlate);
		if (onFocus) onFocus(e);
	}, [setFocusedEditor, setCachedFocusedEditor, onFocus]);
	const newOnBlur: React.FocusEventHandler<HTMLDivElement> = useToastedCallback(e => {
		setFocusedEditor(undefined);
		if (onBlur) onBlur(e);
	}, [setFocusedEditor, onBlur]);
	return <Editable onFocus={newOnFocus} onBlur={newOnBlur} {...rest}/>;
}
