import React, { memo, ReactElement, useMemo, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { __E2E__ } from '../../../constants/env';
import { Text01S } from '../../../styles/text';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { closeSheet } from '../../../store/slices/ui';
import { ignoreBackup } from '../../../store/slices/user';
import { showBottomSheet } from '../../../store/utils/ui';
import { useNoTransactions } from '../../../hooks/wallet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import { useBalance } from '../../../hooks/wallet';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { objectKeys } from '../../../utils/objectKeys';
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

const BackupPrompt = ({ enabled }: { enabled: boolean }): ReactElement => {
	const { t } = useTranslation('security');
	const snapPoints = useSnapPoints('medium');
	const empty = useNoTransactions();
	const dispatch = useAppDispatch();
	const viewControllers = useAppSelector(viewControllersSelector);
	const ignoreTimestamp = useAppSelector(ignoreBackupTimestampSelector);
	const backupVerified = useAppSelector(backupVerifiedSelector);
	const { totalBalance } = useBalance();

	useBottomSheetBackPress('backupPrompt');

	const anyBottomSheetIsOpen = useMemo(() => {
		const viewControllerKeys = objectKeys(viewControllers);
		return viewControllerKeys
			.filter((view) => view !== 'backupPrompt')
			.some((view) => viewControllers[view].isOpen);
	}, [viewControllers]);

	const handleLater = (): void => {
		dispatch(ignoreBackup());
		dispatch(closeSheet('backupPrompt'));
	};

	const handleBackup = (): void => {
		dispatch(closeSheet('backupPrompt'));
		showBottomSheet('backupNavigation');
	};

	// if backup has not been verified
	// and wallet has transactions
	// and user has not seen this prompt for ASK_INTERVAL
	// and no other bottom-sheets are shown
	// and user on "Wallets" screen for CHECK_DELAY
	const shouldShowBottomSheet = useMemo(() => {
		const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
		return (
			enabled &&
			!__E2E__ &&
			!backupVerified &&
			!empty &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [enabled, backupVerified, empty, ignoreTimestamp, anyBottomSheetIsOpen]);

	useEffect(() => {
		if (!shouldShowBottomSheet) {
			return;
		}

		const timer = setTimeout(() => {
			showBottomSheet('backupPrompt');
		}, CHECK_DELAY);

		return (): void => {
			clearTimeout(timer);
		};
	}, [shouldShowBottomSheet]);

	const text = useMemo(
		() => t(totalBalance > 0 ? 'backup_funds' : 'backup_funds_no'),
		[totalBalance, t],
	);

	return (
		<BottomSheetWrapper
			view="backupPrompt"
			snapPoints={snapPoints}
			backdrop={true}
			onClose={(): void => {
				dispatch(ignoreBackup());
			}}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader
					title={t('backup_wallet')}
					displayBackButton={false}
				/>
				<Text01S color="white50">{text}</Text01S>
				<GlowImage image={imageSrc} imageSize={170} glowColor="blue" />
				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						variant="secondary"
						text={t('later')}
						onPress={handleLater}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text={t('backup_button')}
						onPress={handleBackup}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
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
