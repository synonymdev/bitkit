import React, { memo, ReactElement, useCallback, useMemo, useRef } from 'react';
import {
	Image,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Lottie from 'lottie-react-native';

import { Caption13Up, Text02M, ClockIcon } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import Glow from '../../components/Glow';
import AmountToggle from '../../components/AmountToggle';
import Store from '../../store/types';
import { toggleView } from '../../store/actions/user';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { navigate } from '../../navigation/root/RootNavigator';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

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

	const txid = useSelector(
		(store: Store) => store.user.viewController.newTxPrompt.txid,
	);
	const activityItem = useSelector((store: Store) =>
		store.activity.items.find(({ id }) => id === txid),
	);

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
			navigate('ActivityDetail', { activityItem });
		}
	};

	return (
		<BottomSheetWrapper
			view="newTxPrompt"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.container}>
				<Lottie
					ref={animationRef}
					style={styles.confetti}
					source={confettiSrc}
					autoPlay
					loop
				/>
				<View>
					<BottomSheetNavigationHeader
						title="Payment Received!"
						displayBackButton={false}
					/>
					<Caption13Up style={styles.received} color="gray1">
						You just received
					</Caption13Up>

					{activityItem && (
						<AmountToggle sats={activityItem.value} onPress={handlePress} />
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
						{!activityItem?.confirmed && (
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
		height: '100%',
		position: 'absolute',
	},
	received: {
		marginTop: 28,
		marginBottom: 8,
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
