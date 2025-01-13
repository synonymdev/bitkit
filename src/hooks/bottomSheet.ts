import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
	viewControllerIsOpenSelector,
	viewControllersSelector,
} from '../store/reselect/ui';
import { closeAllSheets, closeSheet } from '../store/slices/ui';
import { TViewController } from '../store/types/ui';
import { objectKeys } from '../utils/objectKeys';
import { useAppDispatch, useAppSelector } from './redux';

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
 * Hook to handle hardware back press (Android) when bottom sheet is open
 * for simple one-sheet screens
 */
export const useBottomSheetBackPress = (
	viewController: TViewController,
): void => {
	const dispatch = useAppDispatch();
	const isBottomSheetOpen = useAppSelector((state) => {
		return viewControllerIsOpenSelector(state, viewController);
	});

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
				dispatch(closeSheet(viewController));
				return true;
			},
		);

		return (): void => {
			backHandlerSubscriptionRef.current?.remove();
			backHandlerSubscriptionRef.current = null;
		};
	}, [isBottomSheetOpen, viewController, dispatch]);
};

/**
 * Hook to handle hardware back press (Android) when bottom sheet is open
 * for screens that are part of a navigator nested in a bottom sheet
 */
export const useBottomSheetScreenBackPress = (): void => {
	const dispatch = useAppDispatch();
	const navigation = useNavigation();
	const viewControllers = useAppSelector(viewControllersSelector);

	const isBottomSheetOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	const backHandlerSubscriptionRef = useRef<NativeEventSubscription | null>(
		null,
	);

	useFocusEffect(
		useCallback(() => {
			if (!isBottomSheetOpen) {
				return;
			}

			backHandlerSubscriptionRef.current = BackHandler.addEventListener(
				'hardwareBackPress',
				() => {
					if (navigation.canGoBack()) {
						navigation.goBack();
					} else {
						dispatch(closeAllSheets());
					}
					return true;
				},
			);

			return (): void => {
				backHandlerSubscriptionRef.current?.remove();
				backHandlerSubscriptionRef.current = null;
			};
		}, [dispatch, isBottomSheetOpen, navigation]),
	);
};
