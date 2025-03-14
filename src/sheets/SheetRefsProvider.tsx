import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ReactNode, RefObject, createContext, useContext } from 'react';
import { SheetId, sheetIds } from '../store/types/ui';

const sheetRefsMap = new Map<SheetId, RefObject<BottomSheetModal | null>>();

const SheetRefsContext = createContext(sheetRefsMap);

export const SheetRefsProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	return (
		<SheetRefsContext.Provider value={sheetRefsMap}>
			{children}
		</SheetRefsContext.Provider>
	);
};

export const useSheetRef = (id: SheetId) => {
	const refsMap = useContext(SheetRefsContext);

	if (!refsMap.has(id)) {
		refsMap.set(id, { current: null });
	}

	return refsMap.get(id)!;
};

export const useAllSheetRefs = () => {
	const refsMap = useContext(SheetRefsContext);

	// Ensure all possible sheet refs are registered
	sheetIds.forEach((id) => {
		if (!refsMap.has(id)) {
			refsMap.set(id, { current: null });
		}
	});

	return Array.from(refsMap.entries()).map(([id, ref]) => ({ id, ref }));
};

export const getSheetRefOutsideComponent = (key: SheetId) => {
	if (!sheetRefsMap.has(key)) {
		sheetRefsMap.set(key, { current: null });
	}
	return sheetRefsMap.get(key)!;
};
