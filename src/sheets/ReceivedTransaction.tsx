import Lottie from 'lottie-react-native';
import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import AmountToggle from '../components/AmountToggle';
import BottomSheet from '../components/BottomSheet';
import BottomSheetNavigationHeader from '../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../components/SafeAreaInset';
import Button from '../components/buttons/Button';
import { __E2E__ } from '../constants/env';
import { rootNavigation } from '../navigation/root/RootNavigationContainer';
import { EActivityType } from '../store/types/activity';
import { SheetsParamList } from '../store/types/ui';
import { getRandomOkText } from '../utils/i18n/helpers';
import { useSheetRef } from './SheetRefsProvider';

const confettiOrangeSrc = require('../assets/lottie/confetti-orange.json');
const confettiPurpleSrc = require('../assets/lottie/confetti-purple.json');
const imageSrc = require('../assets/illustrations/coin-stack-x.png');

const SheetContent = ({
	data,
}: { data: SheetsParamList['receivedTx'] }): ReactElement => {
	const reducedMotion = useReducedMotion();
	const { t } = useTranslation('wallet');
	const sheetRef = useSheetRef('receivedTx');

	const { id, activityType, value } = data;
	const isOnchainItem = activityType === EActivityType.onchain;

	const buttonText = useMemo(() => getRandomOkText(), []);

	const onButtonPress = (): void => {
		sheetRef.current?.close();
	};

	const onAmountPress = (): void => {
		sheetRef.current?.close();
		rootNavigation.navigate('ActivityDetail', { id });
	};

	return (
		<View style={styles.root}>
			<View style={styles.confetti} pointerEvents="none">
				<Lottie
					source={isOnchainItem ? confettiOrangeSrc : confettiPurpleSrc}
					style={styles.lottie}
					resizeMode="cover"
					autoPlay={!(__E2E__ || reducedMotion)}
					loop
				/>
			</View>
			<BottomSheetNavigationHeader
				title={
					isOnchainItem ? t('payment_received') : t('instant_payment_received')
				}
				showBackButton={false}
			/>

			<View style={styles.content}>
				<AmountToggle
					amount={value}
					testID="ReceivedTransaction"
					onPress={onAmountPress}
				/>

				<View style={styles.imageContainer} pointerEvents="none">
					<Image source={imageSrc} style={styles.image1} />
					<Image source={imageSrc} style={styles.image2} />
					<Image source={imageSrc} style={styles.image3} />
					<Image source={imageSrc} style={styles.image4} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={buttonText}
						size="large"
						testID="ReceivedTransactionButton"
						onPress={onButtonPress}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const ReceivedTransaction = (): ReactElement => {
	return (
		<BottomSheet id="receivedTx" size="large">
			{({ data }: { data: SheetsParamList['receivedTx'] }) => {
				return <SheetContent data={data} />;
			}}
		</BottomSheet>
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

export default memo(ReceivedTransaction);
