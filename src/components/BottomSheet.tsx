import {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetBackgroundProps,
	BottomSheetModal,
	BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { ReactNode, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { __E2E__ } from '../constants/env';
import { useSnapPoints } from '../hooks/bottomSheet';
import useColors from '../hooks/colors';
import { useSheetRef } from '../sheets/SheetRefsProvider';
import { SheetId } from '../store/types/ui';
import BottomSheetBackground from './BottomSheetBackground';

type SheetProps = {
	id: SheetId;
	children: ((data: any) => ReactNode) | ReactNode;
	size?: 'small' | 'medium' | 'large' | 'calendar';
	testID?: string;
	onOpen?: () => void;
	onClose?: () => void;
};

const Sheet = ({
	id,
	children,
	size = 'large',
	testID,
	onOpen,
	onClose,
}: SheetProps) => {
	const colors = useColors();
	const sheetRef = useSheetRef(id);
	const isReducedMotion = useReducedMotion();
	const snapPoints = useSnapPoints(size);

	// https://github.com/gorhom/react-native-bottom-sheet/issues/770#issuecomment-1072113936
	// do not activate BottomSheet if swipe horizontally, this allows using Swiper inside of it
	const activeOffsetX = useMemo(() => [-999, 999], []);
	const activeOffsetY = useMemo(() => [-10, 10], []);

	const backdropComponent = useCallback((props: BottomSheetBackdropProps) => {
		return (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				accessibilityLabel="Close"
			/>
		);
	}, []);

	const backgroundComponent = useCallback(
		({ style }: BottomSheetBackgroundProps) => (
			<BottomSheetBackground style={style} />
		),
		[],
	);

	const onChange = useCallback(
		(index: number) => {
			if (index === -1) {
				onClose?.();
			} else if (index >= 0) {
				onOpen?.();
			}
		},
		[onOpen, onClose],
	);

	return (
		<BottomSheetModal
			name={id}
			ref={sheetRef}
			snapPoints={snapPoints}
			handleStyle={styles.handle}
			handleIndicatorStyle={{ backgroundColor: colors.gray2 }}
			backdropComponent={backdropComponent}
			backgroundComponent={backgroundComponent}
			stackBehavior="push"
			animateOnMount={!isReducedMotion && !__E2E__}
			enablePanDownToClose={true}
			keyboardBlurBehavior="restore"
			// @ts-ignore
			activeOffsetX={activeOffsetX}
			// @ts-ignore
			activeOffsetY={activeOffsetY}
			onChange={onChange}>
			{(data) => {
				return (
					<BottomSheetView style={styles.container} testID={testID}>
						{typeof children === 'function' ? children(data) : children}
					</BottomSheetView>
				);
			}}
		</BottomSheetModal>
	);
};

const styles = StyleSheet.create({
	container: {
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
		height: '100%',
		position: 'relative',
	},
	handle: {
		alignSelf: 'center',
		height: 32,
		width: 32,
	},
});

export default Sheet;
