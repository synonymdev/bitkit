import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';

import {
	Easing,
	FadeIn,
	FadeOut,
	SharedValue,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import {
	Canvas,
	RadialGradient,
	Rect,
	rect,
	vec,
} from '@shopify/react-native-skia';

import { AnimatedView, View } from '../../../styles/components';
import { BitcoinCircleIcon, EyeIcon } from '../../../styles/icons';
import { Title } from '../../../styles/text';
import NavigationHeader from '../../../components/NavigationHeader';
import useColors from '../../../hooks/colors';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { useBalance, useSwitchUnitAnnounced } from '../../../hooks/wallet';
import ActivityList from '../../Activity/ActivityList';
import BitcoinBreakdown from './BitcoinBreakdown';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Money from '../../../components/Money';
import BlurView from '../../../components/BlurView';
import { updateSettings } from '../../../store/slices/settings';
import {
	hideBalanceSelector,
	enableSwipeToHideBalanceSelector,
} from '../../../store/reselect/settings';
import { capitalize } from '../../../utils/helpers';
import DetectSwipe from '../../../components/DetectSwipe';
import type { WalletScreenProps } from '../../../navigation/types';
import { showToast } from '../../../utils/notifications';
import { useTranslation } from 'react-i18next';
import { ignoresHideBalanceToastSelector } from '../../../store/reselect/user';
import { ignoreHideBalanceToast } from '../../../store/slices/user';

const updateHeight = ({ height, toValue = 0, duration = 250 }): void => {
	try {
		height.value = withTiming(toValue, {
			duration,
			easing: Easing.inOut(Easing.ease),
		});
	} catch {}
};

const Glow = ({
	color,
	size,
}: {
	color: string;
	size: SharedValue<{ width: number; height: number }>;
}): ReactElement => {
	const rct = useDerivedValue(
		() => rect(0, 0, size.value.width, size.value.height),
		[size.value.width, size.value.height],
	);

	return (
		<Rect rect={rct}>
			<RadialGradient
				c={vec(-450, 0)}
				r={Platform.OS === 'ios' ? 1050 : 900}
				colors={[color, 'transparent']}
			/>
		</Rect>
	);
};

const WalletsDetail = ({
	route,
}: WalletScreenProps<'WalletsDetail'>): ReactElement => {
	const { assetType } = route.params;
	const { totalBalance } = useBalance();
	const dispatch = useAppDispatch();
	const enableSwipeToHideBalance = useAppSelector(
		enableSwipeToHideBalanceSelector,
	);
	const hideBalance = useAppSelector(hideBalanceSelector);
	const ignoresHideBalanceToast = useAppSelector(
		ignoresHideBalanceToastSelector,
	);
	const onSwitchUnit = useSwitchUnitAnnounced();
	const colors = useColors();
	const size = useSharedValue({ width: 0, height: 0 });
	const title = capitalize(assetType);
	const [showDetails, setShowDetails] = useState(true);
	const [radiusContainerHeight, setRadiusContainerHeight] = useState(400);
	const [headerHeight, setHeaderHeight] = useState(0);
	const height = useSharedValue(0);
	const { t } = useTranslation('wallet');

	const activityPadding = useMemo(
		() => ({ paddingTop: radiusContainerHeight, paddingBottom: 230 }),
		[radiusContainerHeight],
	);

	useEffect(() => {
		updateHeight({ height, toValue: headerHeight });
	}, [height, headerHeight]);

	const toggleHideBalance = (): void => {
		const enabled = !hideBalance;
		dispatch(updateSettings({ hideBalance: enabled }));
		if (!ignoresHideBalanceToast && enabled) {
			showToast({
				type: 'info',
				title: t('balance_hidden_title'),
				description: t('balance_hidden_message'),
			});
			dispatch(ignoreHideBalanceToast());
		}
	};

	const onScroll = useCallback(
		(e: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { y } = e.nativeEvent.contentOffset;

			//HIDE
			if (y > 150 && showDetails) {
				//Shrink the detail view
				setShowDetails(false);
				updateHeight({ height, toValue: 30 });
			}

			//SHOW
			if (y < 100 && !showDetails) {
				//They scrolled up so show more details now
				setShowDetails(true);
				updateHeight({ height, toValue: headerHeight });
			}
		},
		[showDetails, height, headerHeight],
	);

	return (
		<AnimatedView style={styles.container}>
			<View color="transparent" style={styles.txListContainer}>
				<ActivityList
					style={styles.txList}
					contentContainerStyle={activityPadding}
					progressViewOffset={radiusContainerHeight + 10}
					filter={{ includeTransfers: true }}
					onScroll={onScroll}
				/>
			</View>
			<View color="transparent" style={styles.radiusContainer}>
				<BlurView>
					<Canvas style={styles.glowCanvas} onSize={size}>
						<Glow color={colors.brand} size={size} />
					</Canvas>
					<View
						style={styles.assetDetailContainer}
						color="white01"
						onLayout={(e): void => {
							const hh = e.nativeEvent.layout.height;
							setRadiusContainerHeight((h) => (h === 400 ? hh : h));
						}}>
						<SafeAreaInset type="top" />
						<NavigationHeader />

						<AnimatedView
							color="transparent"
							style={[styles.header, { minHeight: height }]}
							onLayout={(e): void => {
								const hh = e.nativeEvent.layout.height;
								setHeaderHeight((h) => (h === 0 ? hh : h));
							}}>
							<View color="transparent" style={styles.row}>
								<View color="transparent" style={styles.cell}>
									<BitcoinCircleIcon color="bitcoin" />
									<Title style={styles.title}>{title}</Title>
								</View>

								{!showDetails && (
									<AnimatedView
										color="transparent"
										style={styles.cell}
										entering={FadeIn}
										exiting={FadeOut}>
										<TouchableOpacity onPress={onSwitchUnit}>
											<Money
												sats={totalBalance}
												enableHide={true}
												highlight={true}
												size="title"
											/>
										</TouchableOpacity>
									</AnimatedView>
								)}
							</View>

							{showDetails && (
								<AnimatedView
									color="transparent"
									entering={FadeIn}
									exiting={FadeOut}>
									<View color="transparent" style={styles.balanceContainer}>
										<DetectSwipe
											enabled={enableSwipeToHideBalance}
											onSwipeLeft={toggleHideBalance}
											onSwipeRight={toggleHideBalance}>
											<TouchableOpacity
												onPress={onSwitchUnit}
												style={styles.largeValueContainer}>
												<Money
													sats={totalBalance}
													enableHide={true}
													highlight={true}
													symbol={true}
													symbolColor="white40"
												/>
												{hideBalance && (
													<TouchableOpacity
														style={styles.toggle}
														testID="ShowBalance"
														onPress={toggleHideBalance}>
														<EyeIcon />
													</TouchableOpacity>
												)}
											</TouchableOpacity>
										</DetectSwipe>
									</View>

									{assetType === 'bitcoin' && <BitcoinBreakdown />}
								</AnimatedView>
							)}
						</AnimatedView>
					</View>
				</BlurView>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	assetDetailContainer: {
		paddingBottom: 16,
	},
	radiusContainer: {
		overflow: 'hidden',
		borderBottomRightRadius: 16,
		borderBottomLeftRadius: 16,
		position: 'relative',
	},
	glowCanvas: {
		width: '100%',
		height: 500, // it needs to be static, otherwise android lagging
		position: 'absolute',
	},
	header: {
		paddingHorizontal: 16,
	},
	balanceContainer: {
		marginTop: 8,
		marginBottom: 30,
	},
	largeValueContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	txListContainer: {
		flex: 1,
		position: 'absolute',
		width: '100%',
		height: '100%',
	},
	txList: {
		paddingHorizontal: 16,
	},
	row: {
		alignItems: 'center',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	cell: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	title: {
		marginLeft: 16,
	},
	toggle: {
		marginTop: 6,
	},
});

export default memo(WalletsDetail);
