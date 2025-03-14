import React, { memo, ReactElement, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheet from '../components/BottomSheet';
import BottomSheetScreen from '../components/BottomSheetScreen';
import { __E2E__ } from '../constants/env';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { useBalance } from '../hooks/wallet';
import { backupVerifiedSelector } from '../store/reselect/user';
import { ignoreBackupTimestampSelector } from '../store/reselect/user';
import { ignoreBackup } from '../store/slices/user';
import { Display } from '../styles/text';
import { useAllSheetRefs, useSheetRef } from './SheetRefsProvider';

const imageSrc = require('../assets/illustrations/safe.png');

const ASK_INTERVAL = 1000 * 60 * 60 * 24; // 1 day - how long this prompt will be hidden if user taps Later
const CHECK_DELAY = 1800; // how long user needs to stay on the home screen before he will see this prompt

const sheetId = 'backupPrompt';

const BackupPrompt = (): ReactElement => {
	const dispatch = useAppDispatch();
	const { t } = useTranslation('security');
	const sheetRefs = useAllSheetRefs();
	const sheetRef = useSheetRef(sheetId);
	const backupNavigationSheetRef = useSheetRef('backupNavigation');
	const ignoreTimestamp = useAppSelector(ignoreBackupTimestampSelector);
	const backupVerified = useAppSelector(backupVerifiedSelector);
	const { totalBalance } = useBalance();

	// biome-ignore lint/correctness/useExhaustiveDependencies: sheetRefs don't change
	useEffect(() => {
		// if backup has not been verified
		// and wallet has balance
		// and user has not seen this prompt for ASK_INTERVAL
		// and no other bottom-sheets are shown
		// and user on home screen for CHECK_DELAY
		const shouldShow = () => {
			const isAnySheetOpen = sheetRefs.some(({ ref }) => ref.current?.isOpen());
			const isTimeoutOver = Number(new Date()) - ignoreTimestamp > ASK_INTERVAL;
			const hasBalance = totalBalance > 0;

			return (
				!__E2E__ &&
				!isAnySheetOpen &&
				isTimeoutOver &&
				!backupVerified &&
				hasBalance
			);
		};

		const timer = setTimeout(() => {
			if (shouldShow()) {
				sheetRef.current?.present();
			}
		}, CHECK_DELAY);

		return () => clearTimeout(timer);
	}, [ignoreTimestamp, backupVerified, totalBalance]);

	const handleLater = (): void => {
		dispatch(ignoreBackup());
		sheetRef.current?.close();
	};

	const handleBackup = (): void => {
		sheetRef.current?.close();
		backupNavigationSheetRef.current?.present();
	};

	const text = totalBalance > 0 ? t('backup_funds') : t('backup_funds_no');

	return (
		<BottomSheet
			id={sheetId}
			size="medium"
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
		</BottomSheet>
	);
};

export default memo(BackupPrompt);
