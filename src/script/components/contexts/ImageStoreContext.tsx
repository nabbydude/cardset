import { Dispatch, SetStateAction, useContext } from "react";
import { createContext } from "react";

export interface imageEntry {
	data: Blob,
	url: string,
}

export interface imageStoreHandle {
	get: (key: number) => imageEntry | undefined,
	set: (key: number, value: Blob) => void,
	delete: (key: number) => void,
	clear: () => void,
	replace: (pairs: [number, Blob][]) => void,
}

export const ImageStoreContext = createContext<readonly [Map<number, imageEntry>, Dispatch<SetStateAction<Map<number, imageEntry>>>]>([new Map(), () => {}]);

export function useImageStore(): imageStoreHandle {
	const [imageStore, setImageStore] = useContext(ImageStoreContext);
	return {
		get: (key: number) => imageStore.get(key),
		set: (key: number, data: Blob) => setImageStore(store => {
			const old = store.get(key);
			if (old) URL.revokeObjectURL(old.url);
			const out = new Map(store);
			out.set(key, { data, url: URL.createObjectURL(data) });
			return out;
		}),
		delete: (key: number) => setImageStore(store => {
			const old = store.get(key);
			if (old) URL.revokeObjectURL(old.url);
			const out = new Map(store);
			out.delete(key);
			return out;
		}),
		clear: () => setImageStore(store => {
			for (const [, v] of store) {
				URL.revokeObjectURL(v.url);
			}
			return new Map();
		}),
		replace: (pairs: [number, Blob][]) => setImageStore(store => {
			for (const [, v] of store) {
				URL.revokeObjectURL(v.url);
			}
			return new Map(pairs.map(([k, data]) => [k, { data, url: URL.createObjectURL(data) }]));
		}),
	};
}
