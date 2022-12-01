import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBuildNumber } from 'react-native-device-info';

import { Text01S } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import { ignoreAppUpdate, toggleView } from '../../store/actions/user';
import Store from '../../store/types';
import GlowImage from '../../components/GlowImage';
import { openURL } from '../../utils/helpers';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';

const imageSrc = require('../../assets/illustrations/bitkit-logo.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 12; // 12h - how long this prompt will be hidden if user taps Later
const CHECK_INTERVAL = 1000; // 1s - how long user needs to stay on Wallets screen before he will see this prompt

// TODO: add correct store IDs and test
// const appleAppID = '1634634088';
const androidPackageName = 'to.synonym.bitkit.wallet';

const appStoreUrl =
	Platform.OS === 'ios'
		? 'https://testflight.apple.com/join/lGXhnwcC'
		: `https://play.google.com/store/apps/details?id=${androidPackageName}`;

const AppUpdatePrompt = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const insets = useSafeAreaInsets();
	const [latestBuildNumber, setLatestBuildNumber] = useState<number>(0);
	const ignoreTimestamp = useSelector(
		(state: Store) => state.user.ignoreAppUpdateTimestamp,
	);
	const anyBottomSheetIsOpen = useSelector((state: Store) => {
		return Object.values(state.user.viewController)
			.filter(({ id }) => id !== 'appUpdatePrompt')
			.some(({ isOpen }) => isOpen);
	});

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('appUpdatePrompt');

	useEffect(() => {
		const getLatestRelease = async (): Promise<void> => {
			try {
				const response = await fetch(
					'https://api.github.com/repos/synonymdev/bitkit/releases',
				);
				const releases = await response.json();
				const tagName = releases[0].tag_name;
				const buildNumber = Number(tagName.split('-beta').pop());
				setLatestBuildNumber(buildNumber);
			} catch (error) {
				console.error(error);
			}
		};

		getLatestRelease();
	}, []);

	const currentBuildNumber = Number(getBuildNumber());
	const showBottomSheet =
		latestBuildNumber > currentBuildNumber && !anyBottomSheetIsOpen;

	// if app update available
	// and user on "Wallets" screen for CHECK_INTERVAL
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// show AppUpdatePrompt
	useEffect(() => {
		if (!showBottomSheet) {
			return;
		}

		const timer = setInterval(() => {
			const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
			if (!isTimeoutOver) {
				return;
			}

			toggleView({
				view: 'appUpdatePrompt',
				data: { isOpen: true },
			});
		}, CHECK_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, [showBottomSheet, ignoreTimestamp]);

	const onCancel = (): void => {
		ignoreAppUpdate();
		toggleView({
			view: 'appUpdatePrompt',
			data: { isOpen: false },
		});
	};

	const onUpdate = async (): Promise<void> => {
		ignoreAppUpdate();
		await openURL(appStoreUrl);
		toggleView({
			view: 'appUpdatePrompt',
			data: { isOpen: false },
		});
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
