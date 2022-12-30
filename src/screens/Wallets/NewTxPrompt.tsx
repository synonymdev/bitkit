import React, { memo, ReactElement, useCallback, useMemo, useRef } from 'react';
import {
	Image,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';

import { Text02M } from '../../styles/text';
import { ClockIcon } from '../../styles/icons';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Glow from '../../components/Glow';
import AmountToggle from '../../components/AmountToggle';
import { toggleView } from '../../store/actions/ui';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { navigate } from '../../navigation/root/RootNavigator';
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
	const snapPoints = useSnapPoints('large');
	const insets = useSafeAreaInsets();
	const animationRef = useRef<Lottie>(null);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.confirming,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const { txid } = useAppSelector((state) =>
		viewControllerSelector(state, 'newTxPrompt'),
	);
	const activityItem = useAppSelector((store) => {
		return store.activity.items.find(({ id }) => id === txid);
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

	const handlePress = (): void => {
		if (activityItem) {
			toggleView({
				view: 'newTxPrompt',
				data: { isOpen: false },
			});
			navigate('ActivityDetail', { id: activityItem.id });
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
				<View>
					<BottomSheetNavigationHeader
						title="Payment Received!"
						displayBackButton={false}
					/>
					{activityItem && (
						<AmountToggle
							sats={activityItem.value}
							reverse={true}
							onPress={handlePress}
						/>
					)}
				</View>

				<View>
					<View style={styles.imageContainer} pointerEvents="none">
						<Glow style={styles.glow} size={600} color="white32" />
						<Image source={imageSrc} style={styles.image3} />
						<Image source={imageSrc} style={styles.image2} />
						<Image source={imageSrc} style={styles.image1} />
						<Image source={imageSrc} style={styles.image4} />
					</View>

					<TouchableOpacity style={buttonContainerStyles} onPress={handlePress}>
						{isOnchainItem && !activityItem?.confirmed && (
							<>
								<ClockIcon color="gray1" />
								<Text02M color="gray1" style={styles.confirmingText}>
									Confirming
								</Text02M>
							</>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
		justifyContent: 'space-between',
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
		marginTop: 'auto',
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
