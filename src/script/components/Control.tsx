import React from "react";
import { card } from "../card";
import { control } from "../control";
import { ImageControl, ImageControlProps } from "./ImageControl";
import { ImageEnumControl, ImageEnumControlProps } from "./ImageEnumControl";
import { ManaTextControl } from "./ManaTextControl";
import { TextControl, TextControlProps } from "./TextControl";

export interface BaseControlProps {
	card: card,
	control: control,
}

export type ControlProps = TextControlProps | ImageControlProps | ImageEnumControlProps;

export type LooseControlProps = BaseControlProps & Omit<TextControlProps & ImageControlProps & ImageEnumControlProps, keyof BaseControlProps>;

export function Control(props: LooseControlProps) {
	const { card, control, ...rest } = props;

	switch (control.type) {
		case "text": {
			if (control.pips_only) {
				return <ManaTextControl card={card} control={control} {...rest}/>;
			} else {
				return <TextControl card={card} control={control} {...rest}/>;
			}
		} break;
		case "image": return <ImageControl card={card} control={control} {...rest}/>;
		case "image_enum": return <ImageEnumControl card={card} control={control} {...rest}/>;
	}
}
