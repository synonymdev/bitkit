import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import Lottie from 'lottie-react-native';
import { useReducedMotion } from 'react-native-reanimated';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import AmountToggle from '../../../components/AmountToggle';
import Button from '../../../components/buttons/Button';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { closeSheet } from '../../../store/slices/ui';
import { activityItemSelector } from '../../../store/reselect/activity';
import { rootNavigation } from '../../../navigation/root/RootNavigator';
import type { SendScreenProps } from '../../../navigation/types';
import { EActivityType } from '../../../store/types/activity';
import { __E2E__ } from '../../../constants/env';

const confettiOrangeSrc = require('../../../assets/lottie/confetti-orange.json');
const confettiPurpleSrc = require('../../../assets/lottie/confetti-purple.json');
const imageSrc = require('../../../assets/illustrations/check.png');

const Success = ({ route }: SendScreenProps<'Success'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { type, amount, txId } = route.params;
	const reducedMotion = useReducedMotion();
	const dispatch = useAppDispatch();
	const activityItem = useAppSelector((state) => {
		return activityItemSelector(state, txId);
	});

	const isOnchain = type === EActivityType.onchain;

	const navigateToTxDetails = (): void => {
		if (activityItem) {
			dispatch(closeSheet('sendNavigation'));
			rootNavigation.navigate('ActivityDetail', { id: activityItem.id });
		}
	};

	const handleClose = (): void => {
		dispatch(closeSheet('sendNavigation'));
	};

	return (
		<GradientView style={styles.root}>
			<View style={styles.confetti} pointerEvents="none" testID="SendSuccess">
				<Lottie
					style={styles.lottie}
					source={isOnchain ? confettiOrangeSrc : confettiPurpleSrc}
					resizeMode="cover"
					autoPlay={!(__E2E__ || reducedMotion)}
					loop
				/>
			</View>

			<BottomSheetNavigationHeader
				title={t('send_sent')}
				displayBackButton={false}
			/>

			<View style={styles.content}>
				<AmountToggle
					amount={amount}
					testID="SendSuccessAmount"
					onPress={navigateToTxDetails}
				/>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						disabled={!activityItem}
						text={t('send_details')}
						onPress={navigateToTxDetails}
					/>
					<Button
						style={styles.button}
						size="large"
						text={t('close')}
						testID="Close"
						onPress={handleClose}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
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
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(Success);
