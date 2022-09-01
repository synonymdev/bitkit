import React, { memo, ReactElement, useMemo, useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Subtitle, Text01S } from '../../../styles/components';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Glow from '../../../components/Glow';
import Button from '../../../components/Button';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import Store from '../../../store/types';
import { toggleView, ignoreBackup } from '../../../store/actions/user';
import { useNoTransactions } from '../../../hooks/wallet';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

const ASK_INTERVAL = 60_000; // how long this propt will be hidden if user taps Later
const CHECK_INTERVAL = 10_000; // how long user needs to stay on Wallets screen before he will see this prompt

const BackupPrompt = ({ screen }: { screen: string }): ReactElement => {
	const snapPoints = useMemo(() => [600], []);

	const ignoreBackupTimestamp = useSelector(
		(state: Store) => state.user.ignoreBackupTimestamp,
	);
	const backupVerified = useSelector(
		(state: Store) => state.user.backupVerified,
	);
	const anyBottmSheetIsOpened = useSelector((state: Store) =>
		Object.values(state.user.viewController).some(({ isOpen }) => isOpen),
	);
	const empty = useNoTransactions();

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

	// if backup has not been verified
	// and user on "Wallets" screen for CHECK_INTERVAL
	// and not other bottom-sheets are shown
	// and user has not seed this prompt for ASK_INTERVAL
	// and wallet has transactions
	// show BackupPrompt
	useEffect(() => {
		if (
			backupVerified ||
			screen !== 'Wallets' ||
			anyBottmSheetIsOpened ||
			empty
		) {
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
	}, [
		screen,
		ignoreBackupTimestamp,
		backupVerified,
		anyBottmSheetIsOpened,
		empty,
	]);

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={true}
			onClose={handleLater}
			view="backupPrompt">
			<View style={styles.root}>
				<View>
					<Subtitle style={styles.title}>Wallet Backup</Subtitle>
					<Text01S color="white5">
						Now that you have some funds in your wallet, it is time to back up
						your money!
					</Text01S>
				</View>
				<View style={styles.imageContainer}>
					<Glow color="blue" size={700} style={styles.glow} />
					<Image
						style={styles.image}
						source={require('../../../assets/illustrations/safe.png')}
					/>
				</View>
				<View style={styles.center}>
					<View style={styles.buttons}>
						<Button
							style={styles.button}
							size="lg"
							variant="secondary"
							text="Later"
							onPress={handleLater}
						/>
						<View style={styles.divider} />
						<Button
							style={styles.button}
							size="lg"
							text="Back Up"
							onPress={handleBackup}
						/>
					</View>
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		alignItems: 'center',
		flex: 1,
		marginHorizontal: 32,
		justifyContent: 'space-between',
	},
	center: {
		alignItems: 'center',
	},
	title: {
		marginBottom: 25,
		alignSelf: 'center',
	},
	imageContainer: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		height: 210,
		width: 210,
	},
	image: {
		width: 170,
		height: 170,
	},
	glow: {
		position: 'absolute',
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 8,
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(BackupPrompt);
