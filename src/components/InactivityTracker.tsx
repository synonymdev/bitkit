import React, {
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import { Keyboard, PanResponder, StyleSheet, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

import { __E2E__ } from '../constants/env';
import { pinOnIdleSelector, pinSelector } from '../store/reselect/settings';
import { isAuthenticatedSelector } from '../store/reselect/ui';
import { updateUi } from '../store/slices/ui';

const INACTIVITY_DELAY = __E2E__ ? 5000 : 1000 * 90; // 90 seconds;

const InactivityTracker = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const timeout = useRef<NodeJS.Timeout>(undefined);
	const dispatch = useAppDispatch();
	const pin = useAppSelector(pinSelector);
	const pinOnIdle = useAppSelector(pinOnIdleSelector);
	const isAuthenticated = useAppSelector(isAuthenticatedSelector);

	const resetInactivityTimeout = useCallback(() => {
		clearTimeout(timeout.current);

		if (pin && pinOnIdle && isAuthenticated) {
			timeout.current = setTimeout(() => {
				Keyboard.dismiss();
				dispatch(updateUi({ isAuthenticated: false }));
				resetInactivityTimeout();
			}, INACTIVITY_DELAY);
		}

		return false;
	}, [pin, pinOnIdle, isAuthenticated, dispatch]);

	useEffect(() => {
		resetInactivityTimeout();
	}, [resetInactivityTimeout]);

	const panResponder = useMemo(() => {
		return PanResponder.create({
			onStartShouldSetPanResponder: resetInactivityTimeout,
			onStartShouldSetPanResponderCapture: resetInactivityTimeout,
			onShouldBlockNativeResponder: () => false,
		});
	}, [resetInactivityTimeout]);

	const panProps = pinOnIdle ? panResponder.panHandlers : {};

	return (
		<View style={styles.root} {...panProps}>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});

export default InactivityTracker;
