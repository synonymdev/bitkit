import React, { memo, ReactElement, useMemo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../../styles/text';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { ignoreBackup } from '../../../store/actions/user';
import { toggleView } from '../../../store/actions/ui';
import { useNoTransactions } from '../../../hooks/wallet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import { useBalance } from '../../../hooks/wallet';
import { useAppSelector } from '../../../hooks/redux';
import { viewControllersSelector } from '../../../store/reselect/ui';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../../hooks/bottomSheet';
import {
	backupVerifiedSelector,
	ignoreBackupTimestampSelector,
} from '../../../store/reselect/user';

const imageSrc = require('../../../assets/illustrations/safe.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2000; // how long user needs to stay on Wallets screen before he will see this prompt

const handleLater = (): void => {
	ignoreBackup();
	toggleView({
		view: 'backupPrompt',
		data: { isOpen: false },
	});
};

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

const BackupPrompt = ({ enabled }: { enabled: boolean }): ReactElement => {
	const snapPoints = useSnapPoints('medium');
	const insets = useSafeAreaInsets();
	const { satoshis: balance } = useBalance({ onchain: true, lightning: true });
	const empty = useNoTransactions();
	const viewControllers = useAppSelector(viewControllersSelector);
	const ignoreTimestamp = useSelector(ignoreBackupTimestampSelector);
	const backupVerified = useSelector(backupVerifiedSelector);

	useBottomSheetBackPress('backupPrompt');

	const anyBottomSheetIsOpen = useMemo(() => {
		return Object.keys(viewControllers)
			.filter((view) => view !== 'backupPrompt')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	// if backup has not been verified
	// and wallet has transactions
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const showBottomSheet = useMemo(() => {
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			!backupVerified &&
			!empty &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [enabled, backupVerified, empty, ignoreTimestamp, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!showBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			toggleView({
				view: 'backupPrompt',
				data: { isOpen: true },
			});
		}, CHECK_DELAY);

		return (): void => {
			clearInterval(timer);
		};
	}, [showBottomSheet]);

	const text = useMemo(
		() =>
			balance > 0
				? 'Now that you have some funds in your wallet, it is time to back up your money!'
				: 'There are no funds in your wallet yet, but you can create a backup if you wish.',
		[balance],
	);

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
				<GlowImage image={imageSrc} imageSize={170} glowColor="blue" />
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
