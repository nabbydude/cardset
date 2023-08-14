import React, { Dispatch, PropsWithChildren, SetStateAction, createContext, useCallback, useMemo } from "react";

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

export function DpiContextWrapper(props: PropsWithChildren<{ value: DpiContextValue }>) {
	const { value, children } = props;
	const { viewDpi, setViewDpi, exportDpi, setExportDpi, lockExportDpi, setLockExportDpi } = value;

	const setBothDpi = useCallback<Dispatch<SetStateAction<number>>>(v => { setViewDpi(v); setExportDpi(v); }, [setViewDpi, setExportDpi]);
	const setLockAndReset = useCallback<Dispatch<SetStateAction<boolean>>>(v => { setLockExportDpi(v); setExportDpi(viewDpi); }, [setLockExportDpi, setExportDpi, viewDpi]);
	
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
