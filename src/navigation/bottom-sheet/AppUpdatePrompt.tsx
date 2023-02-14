import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBundleId } from 'react-native-device-info';

import { Text01S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import { ignoreAppUpdate } from '../../store/actions/user';
import { showBottomSheet, closeBottomSheet } from '../../store/actions/ui';
import GlowImage from '../../components/GlowImage';
import { openURL } from '../../utils/helpers';
import { objectKeys } from '../../utils/objectKeys';
import { useAppSelector } from '../../hooks/redux';
import { ignoreAppUpdateTimestampSelector } from '../../store/reselect/user';
import {
	availableUpdateTypeSelector,
	viewControllersSelector,
} from '../../store/reselect/ui';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/bitkit-logo.png');

// TODO: add correct store IDs and test
// const appleAppID = '1634634088';
const androidPackageName = getBundleId();
const appStoreUrl =
	Platform.OS === 'ios'
		? 'https://testflight.apple.com/join/lGXhnwcC'
		: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

const ASK_INTERVAL = 1000 * 60 * 60 * 12; // 12h - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2500; // how long user needs to stay on Wallets screen before he will see this prompt

const AppUpdatePrompt = ({ enabled }: { enabled: boolean }): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const insets = useSafeAreaInsets();
	const viewControllers = useAppSelector(viewControllersSelector);
	const updateType = useAppSelector(availableUpdateTypeSelector);
	const ignoreTimestamp = useAppSelector(ignoreAppUpdateTimestampSelector);

	useBottomSheetBackPress('appUpdatePrompt');

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'appUpdatePrompt')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	// if optional app update available
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			updateType === 'optional' &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [enabled, updateType, ignoreTimestamp, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('appUpdatePrompt');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const onCancel = (): void => {
		ignoreAppUpdate();
		closeBottomSheet('appUpdatePrompt');
	};

	const onUpdate = async (): Promise<void> => {
		ignoreAppUpdate();
		await openURL(appStoreUrl);
		closeBottomSheet('appUpdatePrompt');
	};

	return (
		<BottomSheetWrapper
			view="appUpdatePrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={ignoreAppUpdate}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title="Update Available"
					displayBackButton={false}
				/>
				<Text01S color="gray1">
					Please update Bitkit to the latest version for new features and bug
					fixes!
				</Text01S>

				<GlowImage image={imageSrc} />

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text="Cancel"
						onPress={onCancel}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text="Update"
						onPress={onUpdate}
					/>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(AppUpdatePrompt);
