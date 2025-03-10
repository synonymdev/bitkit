import React, { memo, ReactElement, useMemo, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheetScreen from '../../components/BottomSheetScreen';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import { __E2E__ } from '../../constants/env';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useBalance } from '../../hooks/wallet';
import { viewControllersSelector } from '../../store/reselect/ui';
import { backupVerifiedSelector } from '../../store/reselect/user';
import { ignoreBackupTimestampSelector } from '../../store/reselect/user';
import { closeSheet } from '../../store/slices/ui';
import { ignoreBackup } from '../../store/slices/user';
import { showBottomSheet } from '../../store/utils/ui';
import { Display } from '../../styles/text';
import { objectKeys } from '../../utils/objectKeys';

const imageSrc = require('../../assets/illustrations/safe.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 2000; // how long user needs to stay on Wallets screen before he will see this prompt

const BackupPrompt = (): ReactElement => {
	const { t } = useTranslation('security');
	const snapPoints = useSnapPoints('medium');
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
			!__E2E__ &&
			!backupVerified &&
			totalBalance > 0 &&
			isTimeoutOver &&
			!anyBottomSheetIsOpen
		);
	}, [backupVerified, totalBalance, ignoreTimestamp, anyBottomSheetIsOpen]);

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

	const text = totalBalance > 0 ? t('backup_funds') : t('backup_funds_no');

	return (
		<BottomSheetWrapper
			view="backupPrompt"
			snapPoints={snapPoints}
			onClose={(): void => {
				dispatch(ignoreBackup());
			}}>
			<BottomSheetScreen
				navTitle={t('backup_wallet')}
				title={
					<Trans
						t={t}
						i18nKey="backup_title"
						components={{ accent: <Display color="blue" /> }}
					/>
				}
				description={text}
				image={imageSrc}
				showBackButton={false}
				continueText={t('backup_button')}
				cancelText={t('later')}
				testID="BackupPrompt"
				onContinue={handleBackup}
				onCancel={handleLater}
			/>
		</BottomSheetWrapper>
	);
};

export default memo(BackupPrompt);
