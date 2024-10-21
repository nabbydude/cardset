import React, { Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react";
import { createContext } from "react";

export interface imageEntry {
	data: Blob,
	url: string,
}

export interface imageStoreHandle {
	get: (key: string) => imageEntry | undefined,
	set: (key: string, value: Blob) => void,
	delete: (key: string) => void,
	clear: () => void,
	replace: (pairs: [string, Blob][]) => void,
	object: Map<string, imageEntry>,
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
	const [imageStore, setImageStore] = useState(new Map<string, imageEntry>());

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

export function useImageStoreHandle(imageStore: Map<string, imageEntry>, setImageStore: Dispatch<SetStateAction<Map<string, imageEntry>>>): imageStoreHandle {
	return useMemo<imageStoreHandle>(() => ({
		get: (key: string) => imageStore.get(key),
		set: (key: string, data: Blob) => setImageStore(store => {
			const old = store.get(key);
			if (old) URL.revokeObjectURL(old.url);
			const out = new Map(store);
			out.set(key, { data, url: URL.createObjectURL(data) });
			return out;
		}),
		delete: (key: string) => setImageStore(store => {
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
		replace: (pairs: [string, Blob][]) => setImageStore(store => {
			for (const [, v] of store) {
				URL.revokeObjectURL(v.url);
			}
			return new Map(pairs.map(([k, data]) => [k, { data, url: URL.createObjectURL(data) }]));
		}),
		object: imageStore,
	}), [imageStore, setImageStore]);
}
