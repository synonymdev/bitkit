import { useEffect, useRef } from 'react';
import { BackHandler, NativeEventSubscription } from 'react-native';
import { toggleView } from '../store/actions/user';
import { TViewController } from '../store/types/user';
import { useAppSelector } from './redux';

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
