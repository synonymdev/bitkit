import React, { ReactElement } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const TwoFingerPressable = ({
	children,
	onGesture,
}: {
	children: ReactElement;
	onGesture: () => void;
}): ReactElement => {
	const gesture = Gesture.Tap().minPointers(2).onStart(onGesture);
	return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
};

export default TwoFingerPressable;
