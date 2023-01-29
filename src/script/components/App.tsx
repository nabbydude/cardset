import React, { useState, useCallback, KeyboardEvent } from "react";
import { BaseEditor, createEditor, Descendant, Editor, Text, Transforms } from "slate";
import { Slate, Editable, withReact, ReactEditor, RenderElementProps } from "slate-react";
import { CustomText } from "../util";
import { CodeBlock, CodeBlockElement } from "./slate/CodeBlock";
import { Paragraph, ParagraphElement } from "./slate/Paragraph";
import { LeafElement } from "./slate/Leaf";

declare module "slate" {
	interface CustomTypes {
		Editor: BaseEditor & ReactEditor,
		Element: Paragraph | CodeBlock,
		Text: CustomText,
	}
}

const initialValue: Descendant[] = [
	{
		type: "Paragraph",
		children: [{ text: "A line of text in a paragraph.", bold: false, italic: false }],
	},
];

export function App() {
	const [editor] = useState(() => withReact(createEditor()))
	// Define a rendering function based on the element passed to `props`. We use
	// `useCallback` here to memoize the function for subsequent renders.
	const renderElement = useCallback((props: RenderElementProps) => {
		switch (props.element.type) {
			case "CodeBlock": {
				return <CodeBlockElement {...props} />;
			}
			case "Paragraph": {
				return <ParagraphElement {...props} />;
			}
		}
	}, []);

	// Define a leaf rendering function that is memoized with `useCallback`.
	const renderLeaf = useCallback(props => {
		return <LeafElement {...props} />
	}, []);

	return (
		<Slate editor={editor} value={initialValue}>
			<Editable
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onKeyDown={e => onKeyDown(e, editor)}
			/>
		</Slate>
	);
}

function onKeyDown(e: KeyboardEvent, editor: Editor) {
	switch (e.key) {
		// When "`" is pressed, keep our existing code block logic.
		case "`": {
			e.preventDefault();
			const [match] = Editor.nodes(editor, {
				match: n => "type" in n && n.type === "CodeBlock",
			});
			Transforms.setNodes(
				editor,
				{ type: match ? "Paragraph" : "CodeBlock" },
				{ match: n => Editor.isBlock(editor, n) }
			);
			break;
		}

		// When "B" is pressed, bold the text in the selection.
		case "b": {
			e.preventDefault();
			Transforms.setNodes(
				editor,
				{ bold: true },
				// Apply it to text nodes, and split the text node up if the
				// selection is overlapping only part of it.
				{ match: n => Text.isText(n), split: true },
			);
			break;
		}
	}
}
