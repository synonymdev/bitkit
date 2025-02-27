import {
	BottomSheetBackdrop,
	BottomSheetBackdropProps,
	BottomSheetBackgroundProps,
	BottomSheetModal,
	BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { ReactNode, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { __E2E__ } from '../constants/env';
import useColors from '../hooks/colors';
import { useAppDispatch } from '../hooks/redux';
import {
	SheetId,
	useSheetRef,
} from '../navigation/bottom-sheet/SheetRefsProvider';
import { closeSheet } from '../store/slices/ui';
import BottomSheetBackground from './BottomSheetBackground';

type SheetProps = {
	id: SheetId;
	snapPoints: number[];
	children: ReactNode;
	testID?: string;
	onOpen?: () => void;
	onClose?: () => void;
};

const Sheet = ({
	id,
	snapPoints,
	children,
	testID,
	onOpen,
	onClose,
}: SheetProps) => {
	const colors = useColors();
	const sheetRef = useSheetRef(id);
	const dispatch = useAppDispatch();
	// const reducedMotion = useReducedMotion();

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
				// Keyboard.dismiss();
				onClose?.();
				// reset sheet params
				dispatch(closeSheet(id));
			} else if (index >= 0) {
				onOpen?.();
			}
		},
		[dispatch, id, onOpen, onClose],
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
			animateOnMount={!__E2E__}
			// enablePanDownToClose={true}
			// enableDismissOnClose={false}
			onChange={onChange}
		>
			<BottomSheetView
				style={styles.container}
				testID={testID}
				onLayout={() => {
					// console.log('Sheet ref is available:', id);
				}}>
				{children}
			</BottomSheetView>
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
