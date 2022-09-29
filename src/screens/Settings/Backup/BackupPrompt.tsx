import React, { memo, ReactElement, useMemo, useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../../styles/components';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Glow from '../../../components/Glow';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import { toggleView, ignoreBackup } from '../../../store/actions/user';
import { useNoTransactions } from '../../../hooks/wallet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import { removeKeysFromObject } from '../../../utils/helpers';
import { TUserViewController } from '../../../store/types/user';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../../hooks/bottomSheet';

const imageSrc = require('../../../assets/illustrations/safe.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_INTERVAL = 10_000; // how long user needs to stay on Wallets screen before he will see this prompt

const BackupPrompt = ({ screen }: { screen: string }): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const empty = useNoTransactions();
	const ignoreBackupTimestamp = useSelector(
		(state: Store) => state.user.ignoreBackupTimestamp,
	);
	const backupVerified = useSelector(
		(state: Store) => state.user.backupVerified,
	);
	const anyBottmSheetIsOpened = useSelector((state: Store) => {
		const otherBottomSheets = removeKeysFromObject(
			state.user.viewController,
			'backupPrompt',
		);
		return Object.values(otherBottomSheets as TUserViewController).some(
			({ isOpen }) => isOpen,
		);
	});

	useBottomSheetBackPress('backupPrompt');

	const handleBackup = (): void => {
		toggleView({
			view: 'backupPrompt',
			data: { isOpen: false },
		});
		toggleView({
			view: 'backupNavigation',
			data: { isOpen: true },
		});
	};

	const handleLater = (): void => {
		ignoreBackup();
		toggleView({
			view: 'backupPrompt',
			data: { isOpen: false },
		});
	};

	const showBackupPrompt =
		!backupVerified && screen === 'Wallets' && !anyBottmSheetIsOpened && !empty;

	// if backup has not been verified
	// and user on "Wallets" screen for CHECK_INTERVAL
	// and not other bottom-sheets are shown
	// and user has not seed this prompt for ASK_INTERVAL
	// and wallet has transactions
	// show BackupPrompt
	useEffect(() => {
		if (!showBackupPrompt) {
			return;
		}

		let firstRun = true;
		const timer = setInterval(() => {
			if (firstRun) {
				firstRun = false;
				return;
			}
			if (Number(new Date()) - ignoreBackupTimestamp < ASK_INTERVAL) {
				return;
			}

			toggleView({
				view: 'backupPrompt',
				data: {
					isOpen: true,
					snapPoint: 0,
				},
			});
		}, CHECK_INTERVAL);

		return (): void => clearInterval(timer);
	}, [showBackupPrompt]);

	// additional check to avoid false render
	if (!showBackupPrompt) {
		return <></>;
	}

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleLater}
			view="backupPrompt">
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title="Wallet Backup"
					displayBackButton={false}
				/>
				<Text01S color="white5">
					Now that you have some funds in your wallet, it is time to back up
					your money!
				</Text01S>
				<View style={styles.imageContainer}>
					<Glow color="blue" size={600} style={styles.glow} />
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						size="large"
						variant="secondary"
						text="Later"
						onPress={handleLater}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text="Back Up"
						onPress={handleBackup}
					/>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 32,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
	},
	image: {
		width: 170,
		height: 170,
	},
	glow: {
		position: 'absolute',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(BackupPrompt);
