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

const INACTIVITY_DELAY = 1000 * 90; // 90 seconds;

const InactivityTracker = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const timeout = useRef<NodeJS.Timeout>();
	const pin = useSelector(pinSelector);
	const pinOnIdle = useSelector(pinOnIdleSelector);

	const resetInactivityTimeout = useCallback(() => {
		clearTimeout(timeout.current);

		if (pin && pinOnIdle) {
			timeout.current = setTimeout(() => {
				Keyboard.dismiss();
				updateUi({ isAuthenticated: false });
			}, INACTIVITY_DELAY);
		}

		return false;
	}, [pin, pinOnIdle]);

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

	return (
		<View style={styles.root} {...panResponder.panHandlers}>
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
