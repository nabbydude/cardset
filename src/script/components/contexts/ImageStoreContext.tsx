import React, { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react";
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
	object: Map<number, imageEntry>,
}

export const ImageStoreContext = createContext<imageStoreHandle>({
	get: () => undefined,
	set: () => {},
	delete: () => {},
	clear: () => {},
	replace: () => {},
	object: new Map(),
});

export interface ImageStoreProviderProps {
	children: ReactNode,
}

export function ImageStoreProvider(props: ImageStoreProviderProps) {
	const { children } = props;
	const [imageStore, setImageStore] = useState(new Map<number, imageEntry>());

	const value = useImageStoreHandle(imageStore, setImageStore);

	useEffect(() => {
		return () => {
			for (const [, v] of imageStore) {
				URL.revokeObjectURL(v.url);
			}
		};
	}, []);
	return (
		<ImageStoreContext.Provider value={value}>
			{children}
		</ImageStoreContext.Provider>
	);
}

export function useImageStoreHandle(imageStore: Map<number, imageEntry>, setImageStore: Dispatch<SetStateAction<Map<number, imageEntry>>>): imageStoreHandle {
	return useMemo<imageStoreHandle>(() => ({
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
		object: imageStore,
	}), [imageStore, setImageStore]);
}
