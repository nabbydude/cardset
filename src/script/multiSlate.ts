import { BaseEditor, Editor, Node, Operation, Path, PathRef, Transforms } from "slate";
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
					// since we apply above, might as well forego the actual arguments and use e.selection for consistency, this shouldnt have any issues unless there's some case where applying a setSelection doesn't actually set the selection to its arguments.
					for (const [view, ref] of e.views) {
						if (MultiEditor.isSending(view)) continue;
						const path = ref.current;
						if (!path) continue;

						CustomEditor.withoutEverNormalizing(view as Editor, () => {
							if (e.selection && Path.isDescendant(e.selection.anchor.path, path) && Path.isDescendant(e.selection.focus.path, path)) {
								// if something is selected and its fully contained in this view.
								// we dont currently handle partial overlaps.
								view.select({
									anchor: { path: Path.relative(e.selection.anchor.path, path), offset: e.selection.anchor.offset },
									focus:  { path: Path.relative(e.selection.focus.path,  path), offset: e.selection.focus.offset  },
								});
							} else {
								// commented out because this causes things to randomly deselect sometimes (like when holding down a key) and I'm not sure why, but I don't think I need this, at least right now
								// view.deselect();
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
								CustomEditor.withoutEverNormalizing(view as Editor, () => {
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
						console.log(e.selection, parent.selection);
						
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
		CustomEditor.withoutEverNormalizing(editor, () => {
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
