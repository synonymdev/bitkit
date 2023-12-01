import React, {
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from 'react';
import { View, PanResponder, StyleSheet, Keyboard } from 'react-native';
import { useSelector } from 'react-redux';

import { updateUi } from '../store/actions/ui';
import { pinOnIdleSelector, pinSelector } from '../store/reselect/settings';
import { isAuthenticatedSelector } from '../store/reselect/ui';
import { __E2E__ } from '../constants/env';

const INACTIVITY_DELAY = __E2E__ ? 5000 : 1000 * 90; // 90 seconds;

const InactivityTracker = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const timeout = useRef<NodeJS.Timeout>();
	const pin = useSelector(pinSelector);
	const pinOnIdle = useSelector(pinOnIdleSelector);
	const isAuthenticated = useSelector(isAuthenticatedSelector);

	const resetInactivityTimeout = useCallback(() => {
		clearTimeout(timeout.current);

		if (pin && pinOnIdle && isAuthenticated) {
			timeout.current = setTimeout(() => {
				Keyboard.dismiss();
				updateUi({ isAuthenticated: false });
				resetInactivityTimeout();
			}, INACTIVITY_DELAY);
		}

		return false;
	}, [pin, pinOnIdle, isAuthenticated]);

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
