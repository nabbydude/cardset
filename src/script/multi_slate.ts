import { BaseEditor, Editor, Node, Operation, Path, PathRef, Transforms } from "slate"
import { HistoryEditor } from "slate-history";
import { CustomEditor, empty } from "./slate";

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
} | {
	editor: undefined,
	path: undefined,
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
					// since we apply above, might as well forego the actual arguments and use e.selection for consistency, this shouldnt have any issues unless there's some case where applying a set_selection doesn't actually set the selection to its arguments.
					for (const [view, ref] of e.views) {
						if (MultiEditor.isSending(view)) continue;
						const path = ref.current;
						if (!path) continue;

						CustomEditor.withoutEverNormalizing(view as Editor, () => {
							if (e.selection && Path.isDescendant(e.selection.anchor.path, path) && Path.isDescendant(e.selection.focus.path, path)) {
								// if something is selected and its fully contained in this view.
								// we dont currently handle partial overlaps.
								Transforms.setSelection(view as Editor, {
									anchor: { path: Path.relative(e.selection.anchor.path, path), offset: e.selection.anchor.offset },
									focus:  { path: Path.relative(e.selection.focus.path,  path), offset: e.selection.focus.offset  },
								});
							} else {
								Transforms.deselect(view as Editor);
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

						const desc_old = Path.isDescendant(op.path, path);
						const desc_new = Path.isDescendant(op.newPath, path);
						if (desc_old) {
							if (desc_new) {
								// move
								CustomEditor.withoutEverNormalizing(view as Editor, () => {
									view.apply({ ...op, path: Path.relative(op.path, path), newPath: Path.relative(op.newPath, path) });
								});
							} else {
								// remove
								throw Error("inter-view move_node not currently supported")
							}
						} else {
							if (desc_new) {
								// insert
								throw Error("inter-view move_node not currently supported")
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
						CustomEditor.withoutEverNormalizing(view as Editor, () => {
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

			CustomEditor.withoutEverNormalizing(parent as Editor, () => {
				switch (op.type) {
					case "set_selection": {
						// since we apply above, might as well forego the actual arguments and use e.selection for consistency, this shouldnt have any issues unless there's some case where applying a set_selection doesn't actually set the selection to its arguments.
						if (e.selection) {
							Transforms.setSelection(parent as Editor, {
								anchor: { path: path.concat(e.selection.anchor.path), offset: e.selection.anchor.offset },
								focus:  { path: path.concat(e.selection.focus.path),  offset: e.selection.focus.offset  },
							});
						} else {
							Transforms.deselect(parent as Editor);
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
	isMultiEditor(value: any): value is MultiEditor {
		return value.views instanceof Map && Editor.isEditor(value);
	},

	/**
	 * Check if a value is a `ViewEditor` object.
	 */
	isViewEditor(value: any): value is ViewEditor {
		return value.viewParent && Editor.isEditor(value);
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
	setView(editor: ViewEditor, parent: MultiEditor, path: Path) {
		MultiEditor.unsetView(editor);

		const ref = Editor.pathRef(parent as Editor, path);
		editor.viewParent.editor = parent;
		editor.viewParent.path = ref;
		const children = [...Node.children(parent as Editor, path)].map(([node]) => node);
		MultiEditor.withoutSendingTo(parent, () => {
			editor.children = children;
		});
		parent.views.set(editor, ref);
		editor.deselect();
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
}
