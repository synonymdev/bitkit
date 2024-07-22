import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Lottie from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'react-native-reanimated';

import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import AmountToggle from '../../components/AmountToggle';
import { closeSheet } from '../../store/slices/ui';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import { rootNavigation } from '../../navigation/root/RootNavigator';
import { getRandomOkText } from '../../utils/i18n/helpers';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { viewControllerSelector } from '../../store/reselect/ui';
import { EActivityType } from '../../store/types/activity';
import Button from '../../components/buttons/Button';
import { __E2E__ } from '../../constants/env';

const confettiOrangeSrc = require('../../assets/lottie/confetti-orange.json');
const confettiPurpleSrc = require('../../assets/lottie/confetti-purple.json');
const imageSrc = require('../../assets/illustrations/coin-stack-x.png');

const NewTxPrompt = (): ReactElement => {
	const reducedMotion = useReducedMotion();
	const { t } = useTranslation('wallet');
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const { activityItem } = useAppSelector((state) => {
		return viewControllerSelector(state, 'newTxPrompt');
	});

	useBottomSheetBackPress('newTxPrompt');

	const onAmountPress = (): void => {
		dispatch(closeSheet('newTxPrompt'));
		rootNavigation.navigate('ActivityDetail', { id: activityItem!.id });
	};

	const onButtonPress = (): void => {
		dispatch(closeSheet('newTxPrompt'));
	};

	const isOnchainItem = activityItem?.activityType === EActivityType.onchain;

	return (
		<BottomSheetWrapper view="newTxPrompt" snapPoints={snapPoints}>
			<View style={styles.root}>
				{activityItem && (
					<View style={styles.confetti} pointerEvents="none">
						<Lottie
							source={isOnchainItem ? confettiOrangeSrc : confettiPurpleSrc}
							style={styles.lottie}
							resizeMode="cover"
							autoPlay={!(__E2E__ || reducedMotion)}
							loop
						/>
					</View>
				)}
				<BottomSheetNavigationHeader
					title={
						isOnchainItem
							? t('payment_received')
							: t('instant_payment_received')
					}
					displayBackButton={false}
				/>

				<View style={styles.content}>
					{activityItem && (
						<AmountToggle
							amount={activityItem.value}
							testID="NewTxPrompt"
							onPress={onAmountPress}
						/>
					)}

					<View style={styles.imageContainer} pointerEvents="none">
						<Image source={imageSrc} style={styles.image1} />
						<Image source={imageSrc} style={styles.image2} />
						<Image source={imageSrc} style={styles.image3} />
						<Image source={imageSrc} style={styles.image4} />
					</View>

					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text={getRandomOkText()}
							size="large"
							testID="NewTxPromptButton"
							onPress={onButtonPress}
						/>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	confetti: {
		...StyleSheet.absoluteFillObject,
		zIndex: 0,
	},
	lottie: {
		height: '100%',
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		marginTop: 'auto',
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		height: 250,
		width: 200,
	},
	image1: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '14%',
		transform: [{ scaleX: -1 }, { rotate: '-10deg' }],
		zIndex: 1,
	},
	image2: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '-17%',
		transform: [{ scaleX: -1 }],
	},
	image3: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '12%',
		left: '12%',
		transform: [{ scaleX: 1 }, { rotate: '210deg' }],
		zIndex: 2,
	},
	image4: {
		width: 220,
		height: 220,
		position: 'absolute',
		bottom: '75%',
		left: '60%',
		transform: [{ rotate: '30deg' }],
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		zIndex: 1,
	},
	button: {
		flex: 1,
	},
});

export default memo(NewTxPrompt);
