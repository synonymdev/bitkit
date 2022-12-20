import React, { memo, ReactElement, useRef } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

export interface IDetectSwipe {
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
	swipeLeftSensitivity?: number;
	swipeRightSensitivity?: number;
	swipeUpSensitivity?: number;
	swipeDownSensitivity?: number;
	children?: ReactElement;
}

const DetectSwipe = ({
	onSwipeLeft,
	onSwipeRight,
	onSwipeUp,
	onSwipeDown,
	swipeLeftSensitivity = 600,
	swipeRightSensitivity = 600,
	swipeUpSensitivity = 600,
	swipeDownSensitivity = 600,
	children,
}: IDetectSwipe): ReactElement => {
	const acticated = useRef(false);

	const gesture = Gesture.Pan()
		.runOnJS(true)
		.minDistance(10)
		.onUpdate((event) => {
			if (acticated.current) {
				return;
			}

			if (onSwipeLeft && event.velocityX <= -swipeLeftSensitivity) {
				//Swiping left
				onSwipeLeft();
				acticated.current = true;
			}
			if (onSwipeRight && event.velocityX >= swipeRightSensitivity) {
				//Swiping right.
				onSwipeRight();
				acticated.current = true;
			}
			if (onSwipeUp && event.velocityY <= -swipeUpSensitivity) {
				//Swiping up
				onSwipeUp();
				acticated.current = true;
			}
			if (onSwipeDown && event.velocityY >= swipeDownSensitivity) {
				//Swiping down.
				onSwipeDown();
				acticated.current = true;
			}
		})
		.onFinalize(() => {
			acticated.current = false;
		});

	return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
};

export default memo(DetectSwipe);
