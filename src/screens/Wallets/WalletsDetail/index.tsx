import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	LayoutAnimation,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import Animated, { EasingNode, FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import {
	Canvas,
	RadialGradient,
	Rect,
	rect,
	useCanvas,
	useComputedValue,
	vec,
} from '@shopify/react-native-skia';
import { useSelector } from 'react-redux';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AnimatedView, Title, View } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import { useBalance } from '../../../hooks/wallet';
import useColors from '../../../hooks/colors';
import ActivityList from '../../Activity/ActivityList';
import BitcoinBreakdown from './BitcoinBreakdown';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Money from '../../../components/Money';
import { EActivityTypes } from '../../../store/types/activity';
import Store from '../../../store/types';
import { updateSettings } from '../../../store/actions/settings';
import BitcoinLogo from '../../../assets/bitcoin-logo.svg';
import { capitalize } from '../../../utils/helpers';
import type { RootStackParamList } from '../../../navigation/types';

const Blur = Platform.OS === 'ios' ? BlurView : View;

const updateHeight = ({
	height = new Animated.Value(0),
	toValue = 0,
	duration = 250,
}): void => {
	try {
		Animated.timing(height, {
			toValue,
			duration,
			easing: EasingNode.inOut(EasingNode.ease),
		}).start();
	} catch {}
};

type Props = NativeStackScreenProps<RootStackParamList, 'WalletsDetail'>;

const Glow = ({ colors }): ReactElement => {
	const { size } = useCanvas();
	const rct = useComputedValue(
		() => rect(0, 0, size.current.width, size.current.height),
		[size],
	);

	return (
		<Rect rect={rct}>
			<RadialGradient
				c={vec(-250, 100)}
				r={600}
				colors={[colors.brand, 'transparent']}
			/>
		</Rect>
	);
};

const WalletsDetail = (props: Props): ReactElement => {
	const { route } = props;
	const { assetType } = route.params;
	const { satoshis } = useBalance({ onchain: true, lightning: true });
	const bitcoinUnit = useSelector((store: Store) => store.settings.bitcoinUnit);
	const colors = useColors();
	const filter = useMemo(() => {
		const types =
			assetType === 'bitcoin'
				? [EActivityTypes.onChain, EActivityTypes.lightning]
				: [EActivityTypes.tether];
		return { types };
	}, [assetType]);
	const title = capitalize(assetType);
	const [showDetails, setShowDetails] = useState(true);
	const [radiusContainerHeight, setRadiusContainerHeight] = useState(400);
	const [headerHeight, setHeaderHeight] = useState(0);

	const activityPadding = useMemo(
		() => ({ paddingTop: radiusContainerHeight, paddingBottom: 230 }),
		[radiusContainerHeight],
	);
	const [height] = useState(new Animated.Value(0));

	useEffect(() => {
		updateHeight({ height, toValue: headerHeight });
	}, [height, headerHeight]);

	const onScroll = useCallback(
		(e: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { y } = e.nativeEvent.contentOffset;

			//HIDE
			if (y > 150 && showDetails) {
				//Shrink the detail view
				LayoutAnimation.easeInEaseOut();
				setShowDetails(false);
				updateHeight({ height, toValue: 30 });
			}

			//SHOW
			if (y < 100 && !showDetails) {
				//They scrolled up so show more details now
				LayoutAnimation.easeInEaseOut();
				setShowDetails(true);
				updateHeight({ height, toValue: headerHeight });
			}
		},
		[showDetails, height, headerHeight],
	);

	const handleSwitchUnit = useCallback(() => {
		const nextUnit = bitcoinUnit === 'satoshi' ? 'BTC' : 'satoshi';
		updateSettings({ bitcoinUnit: nextUnit });
	}, [bitcoinUnit]);

	return (
		<AnimatedView style={styles.container}>
			<View color={'transparent'} style={styles.txListContainer}>
				<ActivityList
					onScroll={onScroll}
					style={styles.txList}
					contentContainerStyle={activityPadding}
					progressViewOffset={radiusContainerHeight + 10}
					filter={filter}
				/>
			</View>
			<View color={'transparent'} style={styles.radiusContainer}>
				<Blur style={styles.blur} />
				<Canvas style={styles.glowCanvas}>
					<Glow colors={colors} />
				</Canvas>
				<View
					style={styles.assetDetailContainer}
					color="white01"
					onLayout={(e): void => {
						const hh = e.nativeEvent.layout.height;
						setRadiusContainerHeight((h) => (h === 400 ? hh : h));
					}}>
					<SafeAreaInsets type={'top'} />

					<NavigationHeader />

					<AnimatedView
						color={'transparent'}
						style={[styles.header, { minHeight: height }]}
						onLayout={(e): void => {
							const hh = e.nativeEvent.layout.height;
							setHeaderHeight((h) => (h === 0 ? hh : h));
						}}>
						<View color={'transparent'} style={styles.row}>
							<View color={'transparent'} style={styles.cell}>
								<BitcoinLogo viewBox="0 0 70 70" height={32} width={32} />
								<Title style={styles.title}>{title}</Title>
							</View>
							{!showDetails ? (
								<AnimatedView
									color={'transparent'}
									style={styles.cell}
									entering={FadeIn}
									exiting={FadeOut}>
									<TouchableOpacity onPress={handleSwitchUnit}>
										<Money sats={satoshis} highlight={true} size="title" />
									</TouchableOpacity>
								</AnimatedView>
							) : null}
						</View>

						{showDetails ? (
							<AnimatedView
								color={'transparent'}
								entering={FadeIn}
								exiting={FadeOut}>
								<View color={'transparent'} style={styles.balanceContainer}>
									<TouchableOpacity
										onPress={handleSwitchUnit}
										style={styles.largeValueContainer}>
										<Money sats={satoshis} highlight={true} />
									</TouchableOpacity>
								</View>
								{assetType === 'bitcoin' ? <BitcoinBreakdown /> : null}
							</AnimatedView>
						) : null}
					</AnimatedView>
				</View>
			</View>
			<SafeAreaInsets type={'bottom'} maxPaddingBottom={20} />
		</AnimatedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	assetDetailContainer: {
		paddingBottom: 20,
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
		marginTop: 20,
		marginBottom: 30,
	},
	largeValueContainer: {
		display: 'flex',
		flexDirection: 'row',
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
	blur: {
		...StyleSheet.absoluteFillObject,
	},
});

export default memo(WalletsDetail);
