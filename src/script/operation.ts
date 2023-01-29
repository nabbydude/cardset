import { modify_rich_text_operation } from "./modify_rich_text_operation";

export enum operation_type {
	modify_rich_text,
}

export interface operation_base {
	type: operation_type,
	timestamp: number, // in the case of runs of operations (like multiple letters typed in succession) timestamp of the most recent change
	explicit: boolean, // true if direct action performed by user, false if automatic operation
	history_stop: boolean, // true if action is a noticable action that should warrant an extra undo press
	do(): void,
	undo(): void,
}

export type operation = modify_rich_text_operation;
