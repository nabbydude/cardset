import { BaseEditor, Editor, Element, Node, Operation, Path, PathRef } from "slate";
import { empty, firstMatchingPath, withoutEverNormalizing } from "./slate";
import { ReactEditor } from "slate-react";
import { useEffect, useLayoutEffect } from "react";

export const SENDING = new WeakMap<MultiEditor | ViewEditor, boolean | undefined>();

export interface MultiEditor extends BaseEditor {
	views: Map<ViewEditor, PathRef>,
}

export interface ViewRef {
	editor: Editor,
	path: PathRef,
}

export interface ViewEditor extends BaseEditor {
	viewParent: ViewParentRef,
}

export type ViewParentRef = {
	editor: MultiEditor,
	path: PathRef,
	readOnly: boolean,
} | {
	editor: undefined,
	path: undefined,
	readOnly: unknown,
}

export interface HistoryShimEditor extends BaseEditor {
	undo: () => void,
	redo: () => void,
}

export function withMulti<T extends BaseEditor>(editor: T): T & MultiEditor {
	const e = editor as T & MultiEditor;
	const { apply } = e;
	e.views = new Map();

	e.apply = (op: Operation) => {
		MultiEditor.withoutSendingTo(e, () => {
			apply(op);
			switch (op.type) {
				case "set_selection": {
					// todo: mirroring selection like this causes issues with ReactEditor when multiple views of overlapping areas are involved. (only one thing can be selected on the dom and ReactEditor directly links that with editor state)
					// for now we just mark certain editors as readOnly so we can have those around

					// since we apply above, might as well forego the actual arguments and use e.selection for consistency, this shouldnt have any issues unless there's some case where applying a setSelection doesn't actually set the selection to its arguments.
					for (const [view, ref] of e.views) {
						if (MultiEditor.isSending(view)) continue;
						if (view.viewParent.readOnly) continue; // see todo above
						const path = ref.current;
						if (!path) continue;

						withoutEverNormalizing(view as Editor, () => {
							if (e.selection && Path.isDescendant(e.selection.anchor.path, path) && Path.isDescendant(e.selection.focus.path, path)) {
								// if something is selected and its fully contained in this view.
								// we dont currently handle partial overlaps.
								view.select({
									anchor: { path: Path.relative(e.selection.anchor.path, path), offset: e.selection.anchor.offset },
									focus:  { path: Path.relative(e.selection.focus.path,  path), offset: e.selection.focus.offset  },
								});
							} else {
								view.deselect();
							}
						});
					}
					break;
				}
				case "move_node": {
					for (const [view, ref] of e.views) {
						if (MultiEditor.isSending(view)) continue;
						const path = ref.current;
						if (!path) continue;

						const descOld = Path.isDescendant(op.path, path);
						const descNew = Path.isDescendant(op.newPath, path);
						if (descOld) {
							if (descNew) {
								// move
								withoutEverNormalizing(view as Editor, () => {
									view.apply({ ...op, path: Path.relative(op.path, path), newPath: Path.relative(op.newPath, path) });
								});
							} else {
								// remove
								throw Error("inter-view moveNode not currently supported");
							}
						} else {
							if (descNew) {
								// insert
								throw Error("inter-view moveNode not currently supported");
							} else {
								continue;
							}
						}
					}
					break;
				}
				default: {
					for (const [view, ref] of e.views) {
						if (MultiEditor.isSending(view)) continue;
						const path = ref.current;
						if (!path) continue;
						if (!Path.isDescendant(op.path, path)) continue;
						withoutEverNormalizing(view as Editor, () => {
							view.apply({ ...op, path: Path.relative(op.path, path) });
						});
					}
				}
			}
		});
	};

	return e;
}

export function withView<T extends BaseEditor>(editor: T): T & ViewEditor {
	const e = editor as T & ViewEditor;
	e.viewParent = {
		editor: undefined,
		path: undefined,
		readOnly: undefined,
	};

	const { apply } = e;
	e.apply = (op: Operation) => {
		MultiEditor.withoutSendingTo(e, () => {
			apply(op);
			const parent = e.viewParent.editor;
			if (!parent) return;
			if (MultiEditor.isSending(parent)) return;
			const path = e.viewParent.path!.current;
			if (!path) return;

			withoutEverNormalizing(parent as Editor, () => {
				switch (op.type) {
					case "set_selection": {
						// todo: mirroring selection like this causes issues with ReactEditor when multiple views of overlapping areas are involved. (only one thing can be selected on the dom and ReactEditor directly links that with editor state)
						// for now we just mark certain editors as readOnly so we can have those around
						if (e.viewParent.readOnly) return;

						// since we apply above, might as well forego the actual arguments and use e.selection for consistency, this shouldnt have any issues unless there's some case where applying a setSelection doesn't actually set the selection to its arguments.
						if (e.selection) {
							parent.select({
								anchor: { path: path.concat(e.selection.anchor.path), offset: e.selection.anchor.offset },
								focus:  { path: path.concat(e.selection.focus.path),  offset: e.selection.focus.offset  },
							});
						} else {
							parent.deselect();
						}
						break;
					}
					case "move_node": {
						parent.apply({ ...op, path: path.concat(op.path), newPath: path.concat(op.newPath) });
						break;
					}
					default: {
						parent.apply({ ...op, path: path.concat(op.path) });
					}
				}
			});
		});
	};

	return e;
}

export const MultiEditor = {
	/**
	 * Check if a value is a `MultiEditor` object.
	 */
	isMultiEditor(value: unknown): value is MultiEditor {
		return !!value && (value as MultiEditor).views instanceof Map && Editor.isEditor(value);
	},

	/**
	 * Check if a value is a `ViewEditor` object.
	 */
	isViewEditor(value: unknown): value is ViewEditor {
		return !!value && (value as ViewEditor).viewParent && Editor.isEditor(value);
	},

	/**
	 * If the editor is in the process of sending out changes to related editors.
	 */
	isSending(editor: MultiEditor | ViewEditor): boolean | undefined {
		return SENDING.get(editor);
	},

	/**
	 * Run a function without sending changes to the passed editor
	 */
	withoutSendingTo(editor: MultiEditor | ViewEditor, fn: () => void): void {
		const sending = SENDING.get(editor);
		SENDING.set(editor, true);
		fn();
		SENDING.set(editor, sending);
	},

	/**
	 * Initialize or change a view editor's view to another parent and/or path
	 */
	setView(editor: ViewEditor, parent: MultiEditor, path: Path, readOnly: boolean = false) {
		MultiEditor.unsetView(editor);

		const ref = Editor.pathRef(parent as Editor, path);
		editor.viewParent.editor = parent;
		editor.viewParent.path = ref;
		editor.viewParent.readOnly = readOnly;
		const children = [...Node.children(parent as Editor, path)].map(([node]) => node);
		MultiEditor.withoutSendingTo(parent, () => {
			editor.children = children;
		});
		parent.views.set(editor, ref);
		MultiEditor.withoutSendingTo(parent, () => {
			if (parent.selection && Path.isDescendant(parent.selection.anchor.path, path) && Path.isDescendant(parent.selection.focus.path, path)) {
				// if something is selected and its fully contained in this view.
				// we dont currently handle partial overlaps.
				editor.select({
					anchor: { path: Path.relative(parent.selection.anchor.path, path), offset: parent.selection.anchor.offset },
					focus:  { path: Path.relative(parent.selection.focus.path,  path), offset: parent.selection.focus.offset  },
				});
			} else {
				editor.deselect();
			}
		});
	},

	unsetView(editor: ViewEditor) {
		if (editor.viewParent.editor) {
			editor.viewParent.editor.views.delete(editor);
			MultiEditor.withoutSendingTo(editor.viewParent.editor, () => {
				editor.children = empty();
			});
		}
		if (editor.viewParent.path) editor.viewParent.path.unref();
		editor.viewParent.editor = undefined;
		editor.viewParent.path = undefined;
	},
};

export function useViewOfMatchingNode(editor: ViewEditor & ReactEditor, parentEditor: MultiEditor, searchPath: Path, partial: Partial<Element>, readOnly: boolean = false) {
	const node = Node.get(parentEditor, searchPath);
	const oldParentEditor = editor.viewParent.editor;
	const oldParentPath = editor.viewParent.path;
	useEffect(() => {
		return () => MultiEditor.unsetView(editor);
	}, []);
	const alreadyValid = (
		parentEditor === oldParentEditor &&
		oldParentPath &&
		oldParentPath.current &&
		Path.isDescendant(oldParentPath.current, searchPath) &&
		Element.matches(Node.get(oldParentEditor, oldParentPath.current) as Element, partial)
	);
	if (!alreadyValid) {
		const matchingPath = firstMatchingPath(node, partial);
		if (matchingPath) {
			const fullPath = searchPath.concat(matchingPath);
			MultiEditor.setView(editor, parentEditor, fullPath, readOnly);
		} else {
			MultiEditor.unsetView(editor);
		}
	}
	// this is all the way down here to match against its dependencies properly
	useLayoutEffect(() => {
		if (editor.selection) ReactEditor.toDOMNode(editor, editor).focus();
	}, [editor.viewParent.editor, editor.viewParent.path]);
}
