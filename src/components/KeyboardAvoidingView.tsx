import React, { ReactElement } from 'react';
import {
	KeyboardAvoidingViewProps,
	Platform,
	KeyboardAvoidingView as RNKeyboardAvoidingView,
} from 'react-native';
import Animated from 'react-native-reanimated';

import useKeyboard from '../hooks/keyboard';

/**
 * Custom component because on Android the height
 * of the 'AvoidingView' is not always correct
 */
const KeyboardAvoidingView = ({
	children,
	behavior = 'padding',
	...props
}: KeyboardAvoidingViewProps): ReactElement => {
	const { keyboardHeight } = useKeyboard();
	const isAndroid = Platform.OS === 'android';

	return (
		<RNKeyboardAvoidingView enabled={!isAndroid} behavior={behavior} {...props}>
			{children}
			{isAndroid && <Animated.View style={{ height: keyboardHeight }} />}
		</RNKeyboardAvoidingView>
	);
};

export default KeyboardAvoidingView;
