import { useEffect, useMemo, useRef } from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { closeBottomSheet } from '../store/actions/ui';
import { viewControllerIsOpenSelector } from '../store/reselect/ui';
import { TViewController } from '../store/types/ui';
import { useAppSelector } from './redux';

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
		return [400 + insets.bottom];
	}, [size, height, insets]);

	return snapPoints;
};

export const useBottomSheetBackPress = (
	viewController: TViewController,
): void => {
	const isBottomSheetOpen = useAppSelector((state) =>
		viewControllerIsOpenSelector(state, viewController),
	);

	const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
		null,
	);

	useEffect(() => {
		if (!isBottomSheetOpen) {
			return;
		}

		backHandlerSubscriptionRef.current = BackHandler.addEventListener(
			'hardwareBackPress',
			() => {
				closeBottomSheet(viewController);
				return true;
			},
		);

		return () => {
			backHandlerSubscriptionRef.current?.remove();
			backHandlerSubscriptionRef.current = null;
		};
	}, [isBottomSheetOpen, viewController]);
};
