import { OverlayToaster } from "@blueprintjs/core";
import { useCallback } from "react";

export const toaster = OverlayToaster.createAsync({ position: "bottom-right" });

// export function toastErrors<P extends unknown[], R extends unknown>(fn: (...args: P) => R): (...args: P) => R {
export function toastErrors<F extends (...args: never[]) => unknown>(fn: F): (...args: Parameters<F>) => (ReturnType<F> | undefined) {
	return (...args: Parameters<F>) => {
		try {
			const res = fn(...args) as ReturnType<F>;

			// if async function then also catch the async parts
			if (typeof (res as Promise<unknown>)?.catch === "function") {
				(res as Promise<unknown>).catch(toastAsError);
			}

			return res;
		} catch (e: unknown) {
			toastAsError(e);
		}
	};
}

export function useToastedCallback<F extends (...args: never[]) => unknown>(fn: F, deps: unknown[]): (...args: Parameters<F>) => (ReturnType<F> | undefined) {
	return useCallback(toastErrors(fn), deps);
}

function getFullErrorText(error: Error) {
	let text = error.message
	let inner = error.cause;
	while (inner instanceof Error) {
		text += `: ${inner.message}`;
		inner = inner.cause;
	}
	return text;
}

export async function toastAsError(e: unknown) {
	let error
	if (e instanceof Error) {
		error = e;
	} else {
		error = Error("Exception thrown of unknown type", { cause: e });
	}

	(await toaster).show({
		message: `${getFullErrorText(error)}`,
		icon: "warning-sign",
		intent: "danger",
		isCloseButtonShown: true,
		timeout: 10000
	});
}
