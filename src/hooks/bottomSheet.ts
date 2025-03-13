import { useEffect, useMemo } from 'react';
import { BackHandler } from 'react-native';
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useAllSheetRefs } from '../sheets/SheetRefsProvider';

export const useSnapPoints = (
	size: 'small' | 'medium' | 'large' | 'calendar',
): number[] => {
	const { height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	const snapPoints = useMemo(() => {
		if (size === 'large') {
			// only Header should be visible
			const preferredHeight = height - (60 + insets.top);
			return [preferredHeight];
		}
		if (size === 'medium') {
			// only Header + Balance should be visible
			const preferredHeight = height - (180 + insets.top);
			const maxHeight = height - (60 + insets.top);
			const minHeight = Math.min(600, maxHeight);
			return [Math.max(preferredHeight, minHeight)];
		}
		if (size === 'calendar') {
			// same as medium + 40px, to be just under search input
			const preferredHeight = height - (140 + insets.top);
			const maxHeight = height - (60 + insets.top);
			const minHeight = Math.min(600, maxHeight);
			return [Math.max(preferredHeight, minHeight)];
		}

		// small / default
		return [400 + Math.max(insets.bottom, 16)];
	}, [size, height, insets]);

	return snapPoints;
};

/**
 * Hook to handle hardware back press (Android) when a bottom sheet is open
 */
export const useBottomSheetBackPress = (): void => {
	const sheetRefs = useAllSheetRefs();

	// biome-ignore lint/correctness/useExhaustiveDependencies: sheetRefs don't change
	useEffect(() => {
		const backAction = () => {
			const openSheets = sheetRefs.filter(({ ref }) => {
				return ref.current?.isOpen();
			});

			if (openSheets.length !== 0) {
				openSheets.forEach(({ ref }) => ref.current?.close());
				return true;
			}

			// if no sheets are open, let the event to bubble up
			return false;
		};

		const backHandler = BackHandler.addEventListener(
			'hardwareBackPress',
			backAction,
		);

		return () => backHandler.remove();
	}, []);
};
