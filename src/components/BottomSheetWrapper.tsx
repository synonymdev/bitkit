/***********************************************************************************
 * This component wraps the @gorhom/bottom-sheet library
 * to more easily take advantage of it throughout the app.
 *
 * Implementation:
 * const snapPoints = useSnapPoints('medium');
 *
 * <BottomSheetWrapper view="viewName" snapPoints={snapPoints}>
 *   <View>...</View>
 * </BottomSheetWrapper>
 *
 * Usage Throughout App:
 * dispatch(showBottomSheet('viewName'));
 * dispatch(showBottomSheet('viewName', { option1: 'value' }));
 * dispatch(closeSheet('viewName'));
 *
 * Check if a given view is open:
 * getStore().user.viewController['viewName'].isOpen;
 ***********************************************************************************/

import BottomSheet, {
	BottomSheetView,
	BottomSheetBackdrop,
	BottomSheetBackgroundProps,
	BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, {
	memo,
	ReactElement,
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useCallback,
	useMemo,
	useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';

import { __E2E__ } from '../constants/env';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { viewControllerSelector } from '../store/reselect/ui';
import { closeSheet } from '../store/slices/ui';
import { TViewController } from '../store/types/ui';
import BottomSheetBackground from './BottomSheetBackground';

export interface BottomSheetWrapperProps {
	children: ReactElement;
	view: TViewController;
	snapPoints: number[];
	backdrop?: boolean;
	testID?: string;
	onOpen?: () => void;
	onClose?: () => void;
}

const BottomSheetWrapper = forwardRef(
	(
		{
			children,
			view,
			snapPoints,
			backdrop = true,
			testID,
			onOpen,
			onClose,
		}: BottomSheetWrapperProps,
		ref,
	): ReactElement => {
		const bottomSheetRef = useRef<BottomSheet>(null);
		const reducedMotion = useReducedMotion();
		const dispatch = useAppDispatch();
		const data = useAppSelector((state) => viewControllerSelector(state, view));
		const theme = useTheme();
		const handleIndicatorStyle = useMemo(
			() => ({ backgroundColor: theme.colors.gray2 }),
			[theme.colors.gray2],
		);
		const [mounted, setMounted] = useState(false);

		// https://github.com/gorhom/react-native-bottom-sheet/issues/770#issuecomment-1072113936
		// do not activate BottomSheet if swipe horizontally, this allows using Swiper inside of it
		const activeOffsetX = useMemo(() => [-999, 999], []);
		const activeOffsetY = useMemo(() => [-10, 10], []);

		useEffect(() => {
			if (data.isOpen) {
				bottomSheetRef.current?.snapToIndex(0);
			} else {
				bottomSheetRef.current?.close();
			}
			setTimeout(() => setMounted(true), 500);
		}, [data.isOpen]);

		useImperativeHandle(ref, () => ({
			snapToIndex(index = 0): void {
				bottomSheetRef.current?.snapToIndex(index);
			},
			expand(): void {
				bottomSheetRef.current?.snapToIndex(1);
			},
			close(): void {
				bottomSheetRef.current?.close();
			},
		}));

		const _onOpen = useCallback(() => onOpen?.(), [onOpen]);

		const _onClose = useCallback(() => {
			if (data.isOpen) {
				dispatch(closeSheet(view));
			}
			onClose?.();
		}, [data.isOpen, view, onClose, dispatch]);

		// callbacks
		const handleSheetChanges = useCallback(
			(index: number) => {
				if (index === -1) {
					_onClose();
				} else if (index >= 0) {
					_onOpen();
				}
			},
			[_onClose, _onOpen],
		);

		const renderBackdrop = useCallback(
			(props: BottomSheetBackdropProps) => {
				if (!backdrop) {
					return null;
				}
				return (
					<BottomSheetBackdrop
						{...props}
						disappearsOnIndex={-1}
						appearsOnIndex={0}
						accessibilityLabel="Close"
					/>
				);
			},
			[backdrop],
		);

		const backgroundComponent = useCallback(
			({ style }: BottomSheetBackgroundProps) => (
				<BottomSheetBackground style={style} />
			),
			[],
		);

		const style = useMemo(
			() => [styles.container, !mounted && { minHeight: snapPoints[0] - 30 }],
			[snapPoints, mounted],
		);

		// Determine initial snapPoint index based on provided data.
		const index = useMemo((): number => (data.isOpen ? 0 : -1), [data.isOpen]);

		return (
			<BottomSheet
				ref={bottomSheetRef}
				backgroundComponent={backgroundComponent}
				backdropComponent={renderBackdrop}
				handleIndicatorStyle={handleIndicatorStyle}
				handleStyle={styles.handle}
				index={index}
				snapPoints={snapPoints}
				animateOnMount={!reducedMotion && !__E2E__}
				enablePanDownToClose={true}
				keyboardBlurBehavior="restore"
				activeOffsetX={activeOffsetX}
				activeOffsetY={activeOffsetY}
				onChange={handleSheetChanges}>
				<BottomSheetView style={style} testID={testID}>
					{children}
				</BottomSheetView>
			</BottomSheet>
		);
	},
);

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

export default memo(BottomSheetWrapper);
