import React, { memo, MutableRefObject, ReactElement, useRef } from 'react';
import {
	GestureDetector,
	Gesture,
	GestureType,
} from 'react-native-gesture-handler';

export interface IDetectSwipe {
	panGestureRef?: MutableRefObject<GestureType>;
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
	panGestureRef,
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
	const activated = useRef(false);

	let gesture = Gesture.Pan()
		.runOnJS(true)
		.minDistance(10)
		.onUpdate((event) => {
			if (activated.current) {
				return;
			}

			if (onSwipeLeft && event.velocityX <= -swipeLeftSensitivity) {
				onSwipeLeft();
				activated.current = true;
			}
			if (onSwipeRight && event.velocityX >= swipeRightSensitivity) {
				onSwipeRight();
				activated.current = true;
			}
			if (onSwipeUp && event.velocityY <= -swipeUpSensitivity) {
				onSwipeUp();
				activated.current = true;
			}
			if (onSwipeDown && event.velocityY >= swipeDownSensitivity) {
				onSwipeDown();
				activated.current = true;
			}
		})
		.onFinalize(() => {
			activated.current = false;
		});

	if (panGestureRef) {
		gesture = gesture.withRef(panGestureRef);
	}

	return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
};

export default memo(DetectSwipe);
