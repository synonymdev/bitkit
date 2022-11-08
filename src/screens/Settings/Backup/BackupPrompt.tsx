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
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../../hooks/bottomSheet';
import { useBalance } from '../../../hooks/wallet';

const imageSrc = require('../../../assets/illustrations/safe.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_INTERVAL = 10000; // how long user needs to stay on Wallets screen before he will see this prompt

const BackupPrompt = (): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const { satoshis: balance } = useBalance({ onchain: true, lightning: true });

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const empty = useNoTransactions();
	const ignoreTimestamp = useSelector(
		(state: Store) => state.user.ignoreBackupTimestamp,
	);
	const backupVerified = useSelector(
		(state: Store) => state.user.backupVerified,
	);
	const anyBottomSheetIsOpen = useSelector((state: Store) => {
		return Object.values(state.user.viewController).some(
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

	const showBottomSheet = !backupVerified && !empty && !anyBottomSheetIsOpen;

	// if backup has not been verified
	// and user on "Wallets" screen for CHECK_INTERVAL
	// and no other bottom-sheets are shown
	// and user has not seen this prompt for ASK_INTERVAL
	// and wallet has transactions
	// show BackupPrompt
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
				view: 'backupPrompt',
				data: { isOpen: true },
			});
		}, CHECK_INTERVAL);

		return (): void => {
			clearInterval(timer);
		};
	}, [showBottomSheet, ignoreTimestamp]);

	const text =
		balance > 0
			? 'Now that you have some funds in your wallet, it is time to back up your money!'
			: 'There are no funds in your wallet yet, but you can create a backup if you wish.';

	return (
		<BottomSheetWrapper
			view="backupPrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={ignoreBackup}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title="Wallet Backup"
					displayBackButton={false}
				/>
				<Text01S color="white5">{text}</Text01S>
				<View style={styles.imageContainer} pointerEvents="none">
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
