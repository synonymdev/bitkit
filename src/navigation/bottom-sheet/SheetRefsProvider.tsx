import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { createContext, useContext } from 'react';
import { ViewControllerParamList } from '../../store/types/ui';

// export type ViewControllerParamList = {
//     activityTagsPrompt: { id: string };
//     addContactModal: undefined;
//     appUpdatePrompt: undefined;
//     backupNavigation: undefined;
//     backupPrompt: undefined;
//     boostPrompt: { onchainActivityItem: TOnchainActivityItem };
//     connectionClosed: undefined;
//     forceTransfer: undefined;
//     forgotPIN: undefined;
//     highBalance: undefined;
//     newTxPrompt: {
//         activityItem: { id: string; activityType: EActivityType; value: number };
//     };
//     orangeTicket: { ticketId: string };
//     PINNavigation: { showLaterButton: boolean };
//     profileAddDataForm: undefined;
//     pubkyAuth: { url: string };
//     quickPay: undefined;
//     receiveNavigation: { receiveScreen: keyof ReceiveStackParamList } | undefined;
//     sendNavigation:
//         | { screen: keyof SendStackParamList }
//         | { screen: 'Quickpay'; invoice: string; amount: number }
//         | { screen: 'LNURLAmount'; pParams: LNURLPayParams; url: string }
//         | {
//                 screen: 'LNURLConfirm';
//                 pParams: LNURLPayParams;
//                 url: string;
//                 amount?: number;
//           }
//         | undefined;
//     timeRangePrompt: undefined;
//     transferFailed: undefined;
//     treasureHunt: { chestId: string };
//     tagsPrompt: undefined;
//     lnurlWithdraw: { wParams: LNURLWithdrawParams };
// };

export type SheetId = keyof ViewControllerParamList;

const sheetRefsMap = new Map<
	SheetId,
	React.MutableRefObject<BottomSheetModal | null>
>();

export const getAllSheetRefs = () => {
	return Array.from(sheetRefsMap.entries()).map(([id, ref]) => ({ id, ref }));
};

// Create a context to hold multiple refs
const SheetRefsContext = createContext(sheetRefsMap);

// Provider Component
export const SheetRefsProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	return (
		<SheetRefsContext.Provider value={sheetRefsMap}>
			{children}
		</SheetRefsContext.Provider>
	);
};

// Custom hook to use the global refs
export const useSheetRef = (id: SheetId) => {
	const refsMap = useContext(SheetRefsContext);

	if (!refsMap.has(id)) {
		refsMap.set(id, { current: null });
	}

	return refsMap.get(id)!; // Directly return the ref
};

export const getSheetRefOutsideComponent = (key: SheetId) => {
	if (!sheetRefsMap.has(key)) {
		sheetRefsMap.set(key, { current: null });
	}
	return sheetRefsMap.get(key)!;
};
