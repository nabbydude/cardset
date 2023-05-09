import React from "react";
import { BaseElement } from "slate";

export interface Document extends BaseElement {
	type: "Document",
	name: string,
}
