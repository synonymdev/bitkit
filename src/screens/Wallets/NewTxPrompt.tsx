import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useRef,
} from 'react';
import {
	AppState,
	Image,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Lottie from 'lottie-react-native';
import { useTranslation } from 'react-i18next';

import { Text02M } from '../../styles/text';
import { ClockIcon } from '../../styles/icons';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Glow from '../../components/Glow';
import AmountToggle from '../../components/AmountToggle';
import { closeBottomSheet } from '../../store/actions/ui';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { rootNavigation } from '../../navigation/root/RootNavigator';
import { useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { viewControllerSelector } from '../../store/reselect/ui';
import { EActivityType } from '../../store/types/activity';

const confettiSrc = require('../../assets/lottie/confetti-orange.json');
const imageSrc = require('../../assets/illustrations/coin-stack-x.png');

const NewTxPrompt = (): ReactElement => {
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('large');
	const animationRef = useRef<Lottie>(null);
	const appState = useRef(AppState.currentState);

	const { txId } = useAppSelector((state) => {
		return viewControllerSelector(state, 'newTxPrompt');
	});
	const activityItem = useAppSelector((store) => {
		return store.activity.items.find(({ id }) => id === txId);
	});

	useBottomSheetBackPress('newTxPrompt');

	// TEMP: fix iOS animation autoPlay
	// @see https://github.com/lottie-react-native/lottie-react-native/issues/832
	useFocusEffect(
		useCallback(() => {
			if (Platform.OS === 'ios') {
				animationRef.current?.reset();
				setTimeout(() => {
					animationRef.current?.play();
				}, 0);
			}
		}, []),
	);

	// TEMP: fix iOS animation on app to foreground
	useEffect(() => {
		const appStateSubscription = AppState.addEventListener(
			'change',
			(nextAppState) => {
				if (
					appState.current.match(/inactive|background/) &&
					nextAppState === 'active'
				) {
					animationRef.current?.play();
				}

				appState.current = nextAppState;
			},
		);

		return () => {
			appStateSubscription.remove();
		};
	}, []);

	const handlePress = (): void => {
		if (activityItem) {
			closeBottomSheet('newTxPrompt');
			rootNavigation.navigate('ActivityDetail', { id: activityItem.id });
		}
	};

	const isOnchainItem = activityItem?.activityType === EActivityType.onchain;

	return (
		<BottomSheetWrapper
			view="newTxPrompt"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<View style={styles.confetti} pointerEvents="none">
					<Lottie ref={animationRef} source={confettiSrc} autoPlay loop />
				</View>
				<BottomSheetNavigationHeader
					title={t('payment_received')}
					displayBackButton={false}
				/>
				{activityItem && (
					<AmountToggle
						sats={activityItem.value}
						reverse={true}
						space={12}
						testID="NewTxPrompt"
						onPress={handlePress}
					/>
				)}

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="white32" />
					<Image source={imageSrc} style={styles.image3} />
					<Image source={imageSrc} style={styles.image2} />
					<Image source={imageSrc} style={styles.image1} />
					<Image source={imageSrc} style={styles.image4} />
				</View>

				<TouchableOpacity style={styles.confirming} onPress={handlePress}>
					{isOnchainItem && !activityItem?.confirmed && (
						<>
							<ClockIcon color="gray1" />
							<Text02M color="gray1" style={styles.confirmingText}>
								{t('payment_confirming')}
							</Text02M>
						</>
					)}
				</TouchableOpacity>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		// justifyContent: 'space-between',
	},
	confetti: {
		...StyleSheet.absoluteFillObject,
		// fix Android confetti height
		...Platform.select({
			android: {
				width: '200%',
			},
		}),
		zIndex: 1,
	},
	imageContainer: {
		marginTop: 'auto',
		alignSelf: 'center',
		position: 'relative',
		height: 200,
		width: 200,
		justifyContent: 'center',
		alignItems: 'center',
	},
	image1: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: 0,
		transform: [{ scaleX: -1 }],
	},
	image2: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '7%',
		transform: [{ scaleX: -1 }, { rotate: '165deg' }],
	},
	image3: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '14%',
		transform: [{ scaleX: -1 }, { rotate: '150deg' }],
	},
	image4: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '75%',
		left: '65%',
		transform: [{ rotate: '45deg' }],
	},
	glow: {
		position: 'absolute',
	},
	confirming: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		minHeight: 50,
	},
	confirmingText: {
		marginLeft: 8,
	},
});

export default memo(NewTxPrompt);
