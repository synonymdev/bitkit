import React, { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Platform,
	Pressable,
	StyleProp,
	StyleSheet,
	ViewStyle,
} from 'react-native';
import { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { receiveIcon, sendIcon } from '../assets/icons/tabs';
import useColors from '../hooks/colors';
import { useAppSelector } from '../hooks/redux';
import { rootNavigation } from '../navigation/root/RootNavigator';
import type { RootNavigationProp } from '../navigation/types';
import { resetSendTransaction } from '../store/actions/wallet';
import { spendingOnboardingSelector } from '../store/reselect/aggregations';
import { viewControllersSelector } from '../store/reselect/ui';
import { toggleBottomSheet } from '../store/utils/ui';
import { AnimatedView } from '../styles/components';
import { ScanIcon } from '../styles/icons';
import ButtonBlur from './buttons/ButtonBlur';

const TabBar = ({
	navigation,
}: {
	navigation: RootNavigationProp;
}): ReactElement => {
	const { white10 } = useColors();
	const insets = useSafeAreaInsets();
	const { t } = useTranslation('wallet');
	const viewControllers = useAppSelector(viewControllersSelector);
	const isSpendingOnboarding = useAppSelector(spendingOnboardingSelector);

	const shouldHide = useMemo(() => {
		const activityFilterSheets = ['timeRangePrompt', 'tagsPrompt'];
		return activityFilterSheets.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	const onReceivePress = (): void => {
		const currentRoute = rootNavigation.getCurrenRoute();

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

	const bottom = useMemo(() => Math.max(insets.bottom, 16), [insets.bottom]);
	const sendXml = useMemo(() => sendIcon('white'), []);
	const receiveXml = useMemo(() => receiveIcon('white'), []);

	if (shouldHide) {
		return <></>;
	}

	return (
		<AnimatedView
			style={[styles.tabRoot, { bottom }]}
			color="transparent"
			entering={FadeIn}>
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
		</AnimatedView>
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
