import { Button, ButtonGroup, Dialog, DialogBody, DialogFooter, HTMLInputProps, MaybeElement, NonIdealState, NumericInput, NumericInputProps, Tooltip } from "@blueprintjs/core";
import React, { DragEvent, DragEventHandler, useCallback, useContext, useEffect, useRef, useState } from "react";
import { card } from "../card";
import { image_control } from "../control";
import { apply_and_write } from "../history";
import { crop, crop_image, getRotationOffset, load_image_from_blob } from "../image";
import { image_property } from "../property";
import { toaster, useToastedCallback } from "../toaster";
import { HistoryContext } from "./contexts/HistoryContext";
import { usePropertyValue } from "./hooks/usePropertyValue";
import { Cropper, CropperPreview, CropperPreviewRef, CropperRef, getPreviewStyle } from "react-advanced-cropper";
import { BlueprintIcons_16Id } from "@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16";
import { show_file_select } from "../file_select";

export interface ImageControlProps {
	card: card,
	control: image_control,
}

export function ImageControl(props: ImageControlProps) {
	const { card, control } = props;
	const property = card.properties.get(control.property_id) as image_property;
	const history = useContext(HistoryContext);
	const value = usePropertyValue(property);
	
	const [dialogOpen, setDialogOpen] = useState(false);
	const cropperRef = useRef<CropperRef | null>(null);
	
	const [sourceImage, setSourceImage] = useState<Blob | undefined>(undefined);

	const closeDialog = useToastedCallback(() => setDialogOpen(false), []);

	const onDrop = useToastedCallback<DragEventHandler>(e => {
		e.preventDefault();
		let file: File;
		if (e.dataTransfer.items) {
			if (e.dataTransfer.items.length !== 1) return;
			const item = e.dataTransfer.items[0];
			if (item.kind !== "file") return;
			file = item.getAsFile()!;
		} else {
			if (e.dataTransfer.files.length !== 1) return;
			file = e.dataTransfer.items[0];
		}
		if (!file.type.startsWith("image/")) return;
		setSourceImage(file);
		setDialogOpen(true);
	}, [card.id, property]);

	const openFileSelectAndCrop = useToastedCallback(async () => {
		const file = await show_file_select("image/*");
		if (file) {
			setSourceImage(file);
			setDialogOpen(true);
		} else {
			(await toaster).show({ intent: "warning", message: "Image selection cancelled" });
		}
	}, []);

	const onApplyCrop = useToastedCallback(async () => {
		const cropper = cropperRef.current;
		if (!cropper) return;
		if (!sourceImage) return;

		const state = cropper.getState();
		if (!state) return;

		const offset = getRotationOffset(state.imageSize.width, state.imageSize.height, state.transforms.rotate);
		const crop: crop = {
			x: state.coordinates!.left - offset.x,
			y: state.coordinates!.top - offset.y,
			width:  state.coordinates!.width,
			height: state.coordinates!.height,
			angle: state.transforms.rotate,
		}

		const blob = await crop_image(sourceImage, crop);
		if (!blob) throw Error("Problem rasterizing cropped image");
		const old_value = property.value;
		const new_value = load_image_from_blob(blob); // todo: save whole image and crop values to nondestructively crop
		apply_and_write(
			history,
			{ type: "card_control", card, control },
			{ type: "change_property_value", property, new_value, old_value },
		);
		setDialogOpen(false);
	}, [history, card, control, property, sourceImage]);

	const src = value?.url ?? "";

	return (
	
		<div className="image" onDoubleClick={openFileSelectAndCrop} onDragOver={onDragOver} onDrop={onDrop}>
			{src ? (
				<img src={src}/>
			) : (
				<NonIdealState
					title="No Image"
					description="Drag and drop or double-click to add one."
				/>
			)}
			<CropperDialog ref={cropperRef} isOpen={dialogOpen} close={closeDialog} sourceImage={sourceImage} onDrop={onDrop} onApply={onApplyCrop}/>
		</div>
	);
}

function onDragOver(e: DragEvent) {
	e.preventDefault();
}

export interface CropperDialogProps {
	ref: React.MutableRefObject<CropperRef | null>,
	isOpen: boolean,
	close: () => void,
	sourceImage?: Blob,
	
	onDrop: DragEventHandler,
	onApply: () => void,
}

export function CropperDialog(props: CropperDialogProps) {
	const { ref, isOpen, sourceImage, close, onDrop, onApply } = props;

	const [sourceImageUrl, setSourceImageUrl] = useState<string>("");

	const [, forceUpdate] = useState({});
	const [aspectRatioLocked, setAspectRatioLocked] = useState(true);

	useEffect(() => {
		if (sourceImage) {
			const url = URL.createObjectURL(sourceImage);
			setSourceImageUrl(url);
			return () => URL.revokeObjectURL(url);
		} else {
			setSourceImageUrl("");
		};
	}, [sourceImage]);

	const cropperSrc = sourceImageUrl ?? "";

	const isOpening = useRef(false);
	const previewRef = useRef<CropperPreviewRef | null>(null);
	
	const onOpening = useCallback(() => {
		isOpening.current = true;
		forceUpdate({});
		const callback = () => {
			ref.current?.refresh();
			previewRef.current?.refresh();
			if (isOpening.current) requestAnimationFrame(callback);
		};
		callback();
	}, []);

	const onOpened = useCallback(() => {
		isOpening.current = false;
		forceUpdate({});
		ref.current?.refresh();
		previewRef.current?.refresh();
	}, []);

	const onUpdate = useCallback(() => { console.log("update"); forceUpdate({}); }, []);

	return (
		<Dialog isOpen={isOpen} title="Crop Image" className="cropperDialog" onClose={close} onOpening={onOpening} onOpened={onOpened}>
			<DialogBody onDragOver={onDragOver} onDrop={onDrop}>
				{cropperSrc ? (
					<div className="content">
						<Cropper
							ref={ref}
							src={cropperSrc}
							onUpdate={onUpdate}
							aspectRatio={aspectRatioLocked ? { minimum: 15/11, maximum: 15/11 } : undefined}
							defaultPosition={(state, settings) => ({
								top: (state.imageSize.height - (state.coordinates?.height ?? state.imageSize.height)) / 2,
								left: (state.imageSize.width - (state.coordinates?.width ?? state.imageSize.width)) / 2,
							})}
							defaultSize={(state, settings) => ({
								width: state.imageSize.width,
								height: state.imageSize.height,
							})}
						/>
						<div className="controls">
							<CropValue
									tooltip="Rotation"
									value={ref.current?.getTransforms().rotate ?? 0}
									onValueChange={(v) => { ref.current?.rotateImage(v-ref.current?.getTransforms().rotate); forceUpdate({}); }}
									stepSize={15}
									downIcon="rotate-ccw"
									upIcon="rotate-cw"
									style={{ width: "8em" }}
							/>
							<CropValue
									tooltip="X"
									value={ref.current?.getCoordinates()?.left ?? 0}
									onValueChange={(v) => { ref.current?.setCoordinates({ left: v }); forceUpdate({}); }}
									stepSize={1}
									downIcon="arrow-left"
									upIcon="arrow-right"
									style={{ width: "8em" }}
							/>
							<CropValue
									tooltip="Y"
									value={ref.current?.getCoordinates()?.top ?? 0}
									onValueChange={(v) => { ref.current?.setCoordinates({ top: v }); forceUpdate({}); }}
									stepSize={1}
									downIcon="arrow-up"
									upIcon="arrow-down"
									style={{ width: "8em" }}
							/>
							<div className="h">
								<div className="v">
									<CropValue
											tooltip="Width"
											value={ref.current?.getCoordinates()?.width ?? 0}
											onValueChange={(v) => { ref.current?.setCoordinates({ width: v }); forceUpdate({}); }}
											stepSize={1}
											downIcon="chevron-left"
											upIcon="chevron-right"
											style={{ width: "8em" }}
									/>
									<CropValue
											tooltip="Height"
											value={ref.current?.getCoordinates()?.height ?? 0}
											onValueChange={(v) => { ref.current?.setCoordinates({ height: v }); forceUpdate({}); }}
											stepSize={1}
											downIcon="chevron-up"
											upIcon="chevron-down"
											style={{ width: "8em" }}
									/>
								</div>
								<Button icon={aspectRatioLocked ? "link" : "unlink"} onClick={() => setAspectRatioLocked(v => !v)}/>
							</div>
							<CropperPreview ref={previewRef} cropper={ref} style={{ width: "8em" }}/>
						</div>
					</div>

				) : (
					<NonIdealState
						title="No Image"
						description="Drag and drop to add one."
					/>
				)}
			</DialogBody>
			<DialogFooter actions={
				<ButtonGroup>
					<Button intent="primary" text="Apply" onClick={onApply}/>
				</ButtonGroup>
			}/>
		</Dialog>
	);
}

type TotalNumericInputProps = NumericInputProps & HTMLInputProps;
interface CropValueProps extends TotalNumericInputProps {
	tooltip: string | React.JSX.Element | undefined,
	value: number,
	onValueChange: (value: number) => void,
	stepSize?: number,
	majorStepSize?: number,
	downIcon: BlueprintIcons_16Id | MaybeElement;
	upIcon: BlueprintIcons_16Id | MaybeElement;
}

function CropValue(props: CropValueProps) {
	const { tooltip, value, onValueChange, stepSize, majorStepSize, downIcon, upIcon , ...rest } = props;

	const [textValue, setTextValue] = useState(String(value));

	useEffect(() => {
		if (parseFloat(textValue) !== value) setTextValue(String(value));
	}, [value])

	const wrappedOnValueChange = useToastedCallback((number: number, string: string) => {
		setTextValue(string);
		onValueChange(number);
	}, [onValueChange]);

	return (
		<Tooltip content={tooltip}>
			<NumericInput
				{...rest}
				value={textValue}
				stepSize={stepSize}
				majorStepSize={majorStepSize ?? stepSize}
				onValueChange={wrappedOnValueChange}
				onBlur={useToastedCallback(() => {
					setTextValue(String(value));
				}, [value])}
				buttonPosition="none"
				rightElement={<ButtonGroup>
					{/* //todo: This should read value at time of edit, not cache it, could cause issues */}
					<Button icon={downIcon} minimal={true} onClick={useCallback(() => { const newValue = value - (stepSize ?? 1); wrappedOnValueChange(newValue, String(newValue)); }, [wrappedOnValueChange, value, stepSize])}/>
					<Button icon={upIcon}   minimal={true} onClick={useCallback(() => { const newValue = value + (stepSize ?? 1); wrappedOnValueChange(newValue, String(newValue)); }, [wrappedOnValueChange, value, stepSize])}/>
				</ButtonGroup>}
			/>
		</Tooltip>
	);
}
