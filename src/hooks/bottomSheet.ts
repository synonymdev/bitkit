import { useEffect, useMemo, useRef } from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import {
	useSafeAreaFrame,
	useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { toggleView } from '../store/actions/user';
import { TViewController } from '../store/types/user';
import { useAppSelector } from './redux';

export const useSnapPoints = (size: 'small' | 'medium' | 'large'): number[] => {
	const { height } = useSafeAreaFrame();
	const insets = useSafeAreaInsets();

	const snapPoints = useMemo(() => {
		if (size === 'large') {
			// only Header should be visible
			return [height - (60 + insets.top)];
		}
		if (size === 'medium') {
			// only Header + Balance should be visible
			return [height - (180 + insets.top)];
		}

		// small / default
		return [400 + insets.bottom];
	}, [size, height, insets]);

	return snapPoints;
};

export const useBottomSheetBackPress = (
	viewController: TViewController,
): void => {
	const isBottomSheetOpen = useAppSelector(
		(store) => store.user.viewController[viewController].isOpen,
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
				toggleView({ view: viewController, data: { isOpen: false } });
				return true;
			},
		);

		return () => {
			backHandlerSubscriptionRef.current?.remove();
			backHandlerSubscriptionRef.current = null;
		};
	}, [isBottomSheetOpen, viewController]);
};
