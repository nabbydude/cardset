import { Dispatch, SetStateAction, useContext } from "react";
import { createContext } from "react"
import { ReactEditor } from "slate-react";

export interface image_entry {
	data: Blob,
	url: string,
}

export interface image_store_handle {
	get: (key: number) => image_entry | undefined,
	set: (key: number, value: Blob) => void,
	delete: (key: number) => void,
	clear: () => void,
	replace: (pairs: [number, Blob][]) => void,
}

export const ImageStoreContext = createContext<readonly [Map<number, image_entry>, Dispatch<SetStateAction<Map<number, image_entry>>>]>([new Map(), () => {}]);

export function useImageStore(): image_store_handle {
	const [image_store, set_image_store] = useContext(ImageStoreContext);
	return {
		get: (key: number) => image_store.get(key),
		set: (key: number, data: Blob) => set_image_store(store => {
			const old = store.get(key);
			if (old) URL.revokeObjectURL(old.url);
			const out = new Map(store);
			out.set(key, { data, url: URL.createObjectURL(data) });
			return out;
		}),
		delete: (key: number) => set_image_store(store => {
			const old = store.get(key);
			if (old) URL.revokeObjectURL(old.url);
			const out = new Map(store);
			out.delete(key);
			return out;
		}),
		clear: () => set_image_store(store => {
			for (const [k, v] of store) {
				URL.revokeObjectURL(v.url);
			}
			return new Map();
		}),
		replace: (pairs: [number, Blob][]) => set_image_store(store => {
			for (const [k, v] of store) {
				URL.revokeObjectURL(v.url);
			}
			return new Map(pairs.map(([k, data]) => [k, { data, url: URL.createObjectURL(data) }]));
		}),
	}
}
