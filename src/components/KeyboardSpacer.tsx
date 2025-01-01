import React, { ReactElement } from 'react';
import { ViewProps } from 'react-native';
import Animated from 'react-native-reanimated';
import useKeyboard from '../hooks/keyboard';

const KeyboardSpacer = (props: ViewProps): ReactElement => {
	const { keyboardHeight } = useKeyboard();
	return <Animated.View style={{ height: keyboardHeight }} {...props} />;
};

export default KeyboardSpacer;
