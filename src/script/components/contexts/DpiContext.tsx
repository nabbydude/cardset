import React, { Dispatch, ReactNode, SetStateAction, createContext, useMemo } from "react";
import { useToastedCallback } from "../../toaster";

export interface DpiContextValue {
	viewDpi: number,
	setViewDpi: Dispatch<SetStateAction<number>>,
	exportDpi: number,
	setExportDpi: Dispatch<SetStateAction<number>>,
	lockExportDpi: boolean,
	setLockExportDpi: Dispatch<SetStateAction<boolean>>,
}

export const DpiContext = createContext<DpiContextValue>({
	viewDpi: 300,
	setViewDpi: () => {},
	exportDpi: 300,
	setExportDpi: () => {},
	lockExportDpi: true,
	setLockExportDpi: () => {},
});

export interface DpiProviderProps {
	value: DpiContextValue,
	children: ReactNode,
}

export function DpiProvider(props: DpiProviderProps) {
	const { value, children } = props;
	const { viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi } = value;

	// this feels like over-comlicated hidden behavior and I wonder if there's a more robust way to do this
	const setBothDpi = useToastedCallback<Dispatch<SetStateAction<number>>>(v => { setViewDpi(v); setExportDpi(v); }, [setViewDpi, setExportDpi]);
	const setLockAndReset = useToastedCallback<Dispatch<SetStateAction<boolean>>>(v => { setLockExportDpi(v); setExportDpi(viewDpi); }, [setLockExportDpi, setExportDpi, viewDpi]);
	
	const newValue = useMemo(() => ({
		viewDpi: viewDpi,
		setViewDpi: lockExportDpi ? setBothDpi : setViewDpi,
		exportDpi: exportDpi,
		setExportDpi: lockExportDpi ? setBothDpi : setExportDpi,
		lockExportDpi: lockExportDpi,
		setLockExportDpi: setLockAndReset,
	}), [viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi]);
	return (
		<DpiContext.Provider value={newValue}>
			{children}
		</DpiContext.Provider>
	);
}
