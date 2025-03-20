import { useNavigation } from '@react-navigation/native';
import React, { ReactElement, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Platform,
	Pressable,
	StyleProp,
	StyleSheet,
	View,
	ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { receiveIcon, sendIcon } from '../assets/icons';
import useColors from '../hooks/colors';
import { useAppSelector } from '../hooks/redux';
import { rootNavigation } from '../navigation/root/RootNavigationContainer';
import type { RootNavigationProp } from '../navigation/types';
import { useSheetRef } from '../sheets/SheetRefsProvider';
import { resetSendTransaction } from '../store/actions/wallet';
import { spendingOnboardingSelector } from '../store/reselect/aggregations';
import { ScanIcon } from '../styles/icons';
import ButtonBlur from './buttons/ButtonBlur';

const TabBar = (): ReactElement => {
	const { white10 } = useColors();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const sendSheetRef = useSheetRef('send');
	const receiveSheetRef = useSheetRef('receive');
	const isSpendingOnboarding = useAppSelector(spendingOnboardingSelector);

	const onReceivePress = (): void => {
		const currentRoute = rootNavigation.getCurrentRoute();
		const screen =
			// if we are on the spending screen and the user has not yet received funds
			currentRoute === 'ActivitySpending' && isSpendingOnboarding
				? 'ReceiveAmount'
				: 'ReceiveQR';

		receiveSheetRef.current?.present({ screen });
	};

	const onSendPress = (): void => {
		// make sure we start with a clean transaction state
		resetSendTransaction();
		sendSheetRef.current?.present();
	};

	const onScanPress = (): void => navigation.navigate('Scanner');

	const borderStyles = useMemo(() => {
		const androidStyles = {
			borderColor: '#282828',
			borderTopColor: '#272727',
			borderBottomColor: '#272727',
		};

		const iosStyles = {
			borderColor: white10,
		};
		return Platform.OS === 'android' ? androidStyles : iosStyles;
	}, [white10]);

	const bottom = Math.max(insets.bottom, 16);
	const sendXml = sendIcon('white');
	const receiveXml = receiveIcon('white');

	return (
		<View style={[styles.tabRoot, { bottom }]}>
			<ButtonBlur
				style={styles.send}
				text={t('send')}
				icon={sendXml}
				testID="Send"
				onPress={onSendPress}
			/>
			<Pressable
				style={({ pressed }): StyleProp<ViewStyle> => [
					styles.tabScan,
					borderStyles,
					pressed && styles.pressed,
				]}
				testID="Scan"
				onPressIn={onScanPress}>
				<ScanIcon width={32} height={32} color="gray2" />
			</Pressable>
			<ButtonBlur
				style={styles.receive}
				text={t('receive')}
				icon={receiveXml}
				testID="Receive"
				onPress={onReceivePress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	tabRoot: {
		position: 'absolute',
		left: 16,
		right: 16,
		height: 80,
		flexDirection: 'row',
		alignItems: 'center',
		// fix TabBar zIndex on Android
		zIndex: 0,
	},
	send: {
		paddingRight: 30,
	},
	receive: {
		paddingLeft: 30,
	},
	tabScan: {
		height: 80,
		width: 80,
		backgroundColor: '#101010',
		borderRadius: 40,
		borderWidth: 2,
		marginHorizontal: -40,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	pressed: {
		opacity: 0.8,
	},
});

export default memo(TabBar);
