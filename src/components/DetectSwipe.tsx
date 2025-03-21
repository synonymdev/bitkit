import React, { memo, RefObject, ReactElement, useRef } from 'react';
import {
	Gesture,
	GestureDetector,
	GestureType,
} from 'react-native-gesture-handler';

export interface IDetectSwipe {
	children: ReactElement;
	enabled?: boolean;
	panGestureRef?: RefObject<GestureType>;
	onSwipeLeft?: () => void;
	onSwipeRight?: () => void;
	onSwipeUp?: () => void;
	onSwipeDown?: () => void;
	swipeLeftSensitivity?: number;
	swipeRightSensitivity?: number;
	swipeUpSensitivity?: number;
	swipeDownSensitivity?: number;
}

const DetectSwipe = ({
	children,
	enabled = true,
	panGestureRef,
	onSwipeLeft,
	onSwipeRight,
	onSwipeUp,
	onSwipeDown,
	swipeLeftSensitivity = 600,
	swipeRightSensitivity = 600,
	swipeUpSensitivity = 600,
	swipeDownSensitivity = 600,
}: IDetectSwipe): ReactElement => {
	const activated = useRef(false);

	let gesture = Gesture.Pan()
		.runOnJS(true)
		.minDistance(10)
		.onUpdate((event) => {
			if (!enabled || activated.current) {
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
