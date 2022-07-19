import React, { memo, ReactElement, useMemo, useEffect } from 'react';
import { StyleSheet, Image, View } from 'react-native';
import { useSelector } from 'react-redux';

import { Subtitle, Text01S } from '../../../styles/components';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Glow from '../../../components/Glow';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import { toggleView, ignoreBackup } from '../../../store/actions/user';
import { useNoTransactions } from '../../../hooks/wallet';

const ASK_INTERVAL = 60_000; // how long this propt will be hidden if user taps Later
const CHECK_INTERVAL = 10_000; // how long user needs to stay on Wallets screen before he will see this prompt

const BackupPrompt = ({ screen }: { screen: string }): ReactElement => {
	const snapPoints = useMemo(() => [450], []);

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
			headerColor="background"
			backdrop={true}
			onClose={handleLater}
			view="backupPrompt">
			<View style={styles.root}>
				<Subtitle style={styles.title}>Wallet backup</Subtitle>
				<Text01S color="white5">
					Now that you have some funds in your wallet, it is time to back up
					your money!
				</Text01S>
				<View style={styles.imageContainer}>
					<Glow color="blue" size={500} style={styles.glow} />
					<Image
						style={styles.image}
						source={require('../../../assets/illustrations/safe.png')}
					/>
				</View>
				<View style={styles.buttons}>
					<Button
						style={styles.button}
						size="lg"
						text="Back up"
						onPress={handleBackup}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="lg"
						variant="secondary"
						text="Later"
						onPress={handleLater}
					/>
				</View>
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		alignItems: 'center',
		flex: 1,
		paddingHorizontal: 32,
	},
	title: {
		marginBottom: 25,
	},
	imageContainer: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		height: 210,
		width: 210,
	},
	image: {
		width: 200,
		height: 200,
	},
	glow: {
		position: 'absolute',
	},
	buttons: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 32,
	},
});

export default memo(BackupPrompt);
