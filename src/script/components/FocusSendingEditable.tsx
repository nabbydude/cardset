import React, { useCallback, useContext } from "react";
import { Editable, ReactEditor, useSlate } from "slate-react";
import { FocusedEditorContext } from "./FocusedEditorContext";

type EditableProps = Parameters<typeof Editable>[0];

export function FocusSendingEditable(props: EditableProps) {
	const { onFocus, onBlur, ...rest } = props;
	const this_slate = useSlate() as ReactEditor;
	const [, setFocusedEditor] = useContext(FocusedEditorContext);

	const newOnFocus: React.FocusEventHandler<HTMLDivElement> = useCallback(e => {
		setFocusedEditor(this_slate);
		if (onFocus) onFocus(e);
	}, [onFocus]);
	const newOnBlur: React.FocusEventHandler<HTMLDivElement> = useCallback(e => {
		setFocusedEditor(undefined);
		if (onBlur) onBlur(e);
	}, [onBlur]);

	return <Editable onFocus={newOnFocus} onBlur={newOnBlur} {...rest}/>
}
