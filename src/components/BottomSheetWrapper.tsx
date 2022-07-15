/***********************************************************************************
 * This component wraps the @gorhom/bottom-sheet library
 * to more easily take advantage of it throughout the app.
 *
 * Implementation:
 * <BottomSheetWrapper view="viewName">
 *   <View>...</View>
 * </BottomSheetWrapper>
 *
 * Usage Throughout App:
 * toggleView({ view: 'viewName', data: { isOpen: true, snapPoint: 1 }});
 * toggleView({ view: 'viewName', data: { isOpen: false }});
 *
 * Check if a given view is open:
 * getStore().user.viewController['viewName'].isOpen;
 ***********************************************************************************/

import React, {
	memo,
	ReactElement,
	forwardRef,
	useImperativeHandle,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from 'react';
import { StyleSheet } from 'react-native';
import BottomSheet, {
	useBottomSheetDynamicSnapPoints,
	BottomSheetView,
	BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { useSelector } from 'react-redux';
import Store from '../store/types';
import { TViewController } from '../store/types/user';
import themes from '../styles/themes';
import { toggleView } from '../store/actions/user';
import { defaultViewController } from '../store/shapes/user';

export interface IModalProps {
	children: ReactElement;
	view?: TViewController;
	onOpen?: () => any;
	onClose?: () => any;
	headerColor?: string;
	snapPoints?: (string | number)[];
	backdrop?: boolean;
}
const BottomSheetWrapper = forwardRef(
	(
		{
			children,
			view,
			onOpen = (): null => null,
			onClose = (): null => null,
			headerColor = undefined,
			snapPoints = ['60%', '95%'],
			backdrop = true,
		}: IModalProps,
		ref,
	): ReactElement => {
		const data = useSelector((state: Store) =>
			view ? state.user?.viewController[view] : defaultViewController,
		);
		const bottomSheetRef = useRef<BottomSheet>(null);

		const settingsTheme = useSelector((state: Store) => state.settings.theme);
		const theme = useMemo(() => themes[settingsTheme], [settingsTheme]);
		const backgroundColor = useMemo(() => {
			if (headerColor) {
				return theme.colors[headerColor];
			}
			return theme.colors.tabBackground;
		}, [theme.colors, headerColor]);
		const backgroundStyle = useMemo(
			() => ({ backgroundColor }),
			[backgroundColor],
		);
		const handleIndicatorStyle = useMemo(
			() => ({ backgroundColor: theme.colors.gray2 }),
			[theme.colors.gray2],
		);
		const handleStyle = useMemo(
			() => [styles.handle, { backgroundColor }],
			[backgroundColor],
		);
		// https://github.com/gorhom/react-native-bottom-sheet/issues/770#issuecomment-1072113936
		// do not activate BottomSheet if swipe horizontally, this allows using Swiper inside of it
		const activeOffsetX = useMemo(() => [-999, 999], []);
		const activeOffsetY = useMemo(() => [-5, 5], []);

		useEffect(() => {
			try {
				if (view) {
					if (data?.isOpen) {
						bottomSheetRef?.current?.snapToIndex(data?.snapPoint ?? -1);
					} else {
						bottomSheetRef?.current?.close();
					}
				}
			} catch {}
		}, [data, data?.isOpen, data?.snapPoint, view]);

		useImperativeHandle(ref, () => ({
			snapToIndex(index: number = 0): void {
				// @ts-ignore
				bottomSheetRef.current.snapToIndex(index);
			},
			expand(): void {
				// @ts-ignore
				bottomSheetRef.current.snapToIndex(1);
			},
			close(): void {
				// @ts-ignore
				bottomSheetRef.current.close();
			},
		}));

		const _snapPoints = useMemo(() => snapPoints, [snapPoints]);
		const initialSnapPoints = useMemo(() => ['60%', '95%'], []);
		const { animatedHandleHeight, handleContentLayout } =
			useBottomSheetDynamicSnapPoints(initialSnapPoints);

		const _onOpen = useCallback(() => onOpen(), [onOpen]);

		const _onClose = useCallback(() => {
			if (view) {
				toggleView({
					view,
					data: { isOpen: false, id: data?.id },
				}).then();
			}
			onClose();
		}, [view, onClose, data?.id]);

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
			(props) => {
				if (!backdrop) {
					return null;
				}
				return (
					<BottomSheetBackdrop
						{...props}
						disappearsOnIndex={-1}
						appearsOnIndex={0}
					/>
				);
			},
			[backdrop],
		);

		// Determine initial snapPoint index based on provided data.
		let index = useMemo((): number => {
			return data?.snapPoint && data?.snapPoint < 2 ? data.snapPoint : -1;
		}, [data?.snapPoint]);

		return (
			<BottomSheet
				backgroundStyle={backgroundStyle}
				handleIndicatorStyle={handleIndicatorStyle}
				handleStyle={handleStyle}
				animateOnMount
				enablePanDownToClose
				keyboardBlurBehavior="restore"
				ref={bottomSheetRef}
				index={index}
				onChange={handleSheetChanges}
				backdropComponent={renderBackdrop}
				handleHeight={animatedHandleHeight}
				snapPoints={_snapPoints}
				activeOffsetX={activeOffsetX}
				activeOffsetY={activeOffsetY}>
				<BottomSheetView
					style={styles.container}
					onLayout={handleContentLayout}>
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
	},
	handleContainer: {
		borderTopLeftRadius: 32,
		borderTopRightRadius: 32,
	},
	handle: {
		alignSelf: 'center',
		height: 4,
		width: 32,
		borderRadius: 32,
		marginTop: 12,
		marginBottom: 11,
	},
});

export default memo(BottomSheetWrapper);
