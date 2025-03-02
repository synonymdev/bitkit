import { useNavigation } from '@react-navigation/native';
import React, { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Platform,
	Pressable,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { receiveIcon, sendIcon } from '../assets/icons/tabs';
import useColors from '../hooks/colors';
import { useAppSelector } from '../hooks/redux';
import { rootNavigation } from '../navigation/root/RootNavigationContainer';
import type { RootNavigationProp } from '../navigation/types';
import { resetSendTransaction } from '../store/actions/wallet';
import { spendingOnboardingSelector } from '../store/reselect/aggregations';
import { viewControllersSelector } from '../store/reselect/ui';
import { TViewController } from '../store/types/ui';
import { toggleBottomSheet } from '../store/utils/ui';
import { ScanIcon } from '../styles/icons';
import ButtonBlur from './buttons/ButtonBlur';

const TabBar = (): ReactElement => {
	const { white10 } = useColors();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('wallet');
	const navigation = useNavigation<RootNavigationProp>();
	const viewControllers = useAppSelector(viewControllersSelector);
	const isSpendingOnboarding = useAppSelector(spendingOnboardingSelector);

	const shouldHide = useMemo(() => {
		const viewControllerKeys: TViewController[] = [
			'backupPrompt',
			'PINNavigation',
			'highBalance',
			'appUpdatePrompt',
			'timeRangePrompt',
			'tagsPrompt',
		];
		return viewControllerKeys.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	const onReceivePress = (): void => {
		const currentRoute = rootNavigation.getCurrentRoute();

		// if we are on the spending screen and the user has not yet received funds
		if (currentRoute === 'ActivitySpending' && isSpendingOnboarding) {
			toggleBottomSheet('receiveNavigation', {
				receiveScreen: 'ReceiveAmount',
			});
		} else {
			toggleBottomSheet('receiveNavigation');
		}
	};

	const onSendPress = (): void => {
		// make sure we start with a clean transaction state
		resetSendTransaction();
		toggleBottomSheet('sendNavigation');
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

	if (shouldHide) {
		return <></>;
	}

	return (
		<Animated.View style={[styles.tabRoot, { bottom }]} entering={FadeIn}>
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
		</Animated.View>
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

export default TabBar;
