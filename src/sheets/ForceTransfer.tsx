import React, { memo, ReactElement, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import BottomSheet from '../components/BottomSheet';
import BottomSheetScreen from '../components/BottomSheetScreen';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { startCoopCloseTimestampSelector } from '../store/reselect/user';
import { clearCoopCloseTimer } from '../store/slices/user';
import { Display } from '../styles/text';
import { closeAllChannels } from '../utils/lightning';
import { showToast } from '../utils/notifications';
import { useSheetRef } from './SheetRefsProvider';

const imageSrc = require('../assets/illustrations/exclamation-mark.png');

const RETRY_INTERVAL = 1000 * 60 * 5;
const GIVE_UP = 1000 * 60 * 30;

const ForceTransfer = (): ReactElement => {
	const { t } = useTranslation('lightning');
	const dispatch = useAppDispatch();
	const sheetRef = useSheetRef('forceTransfer');
	const startTime = useAppSelector(startCoopCloseTimestampSelector);
	const [isPending, setIsPending] = useState(false);

	// try to cooperatively close the channel(s) for 30min
	// biome-ignore lint/correctness/useExhaustiveDependencies: sheetRef doesn't change
	useEffect(() => {
		// biome-ignore lint/style/useConst: false alarm
		let interval: NodeJS.Timer;

		if (!startTime) {
			return;
		}

		const tryChannelCoopClose = async (): Promise<void> => {
			console.log('trying coop close...');
			const closeResponse = await closeAllChannels();
			if (closeResponse.isErr()) {
				console.log('coop close failed.');
			}
			if (closeResponse.isOk()) {
				if (closeResponse.value.length === 0) {
					console.log('coop close success.');
					dispatch(clearCoopCloseTimer());
					clearInterval(interval);
				} else {
					console.log('coop close failed.');
					console.log({ closeResponse: closeResponse.value });
				}
			}
		};

		interval = setInterval(() => {
			const isTimeoutOver = Number(new Date()) - startTime > GIVE_UP;
			if (isTimeoutOver) {
				console.log('giving up on coop close.');
				dispatch(clearCoopCloseTimer());
				clearInterval(interval);
				sheetRef.current?.present();
				return;
			}

			tryChannelCoopClose();
		}, RETRY_INTERVAL);

		return (): void => {
			clearInterval(interval);
		};
	}, [startTime, dispatch]);

	const onCancel = (): void => {
		sheetRef.current?.close();
	};

	const onContinue = async (): Promise<void> => {
		setIsPending(true);

		const closeResponse = await closeAllChannels({
			force: true,
		});
		if (closeResponse.isErr()) {
			showToast({
				type: 'warning',
				title: t('close_error'),
				description: t('close_error_msg'),
			});
			setIsPending(false);
			return;
		}
		if (closeResponse.isOk()) {
			setIsPending(false);
			if (closeResponse.value.length === 0) {
				showToast({
					type: 'success',
					title: t('force_init_title'),
					description: t('force_init_msg'),
				});
				sheetRef.current?.close();
			} else {
				showToast({
					type: 'warning',
					title: t('force_failed_title'),
					description: t('force_failed_msg'),
				});
			}
		}
	};

	return (
		<BottomSheet id="forceTransfer" size="large">
			<BottomSheetScreen
				navTitle={t('force_nav_title')}
				title={
					<Trans
						t={t}
						i18nKey="force_title"
						components={{ accent: <Display color="yellow" /> }}
					/>
				}
				description={t('force_text')}
				image={imageSrc}
				isLoading={isPending}
				continueText={t('force_button')}
				cancelText={t('cancel')}
				testID="ForceTransfer"
				onContinue={onContinue}
				onCancel={onCancel}
			/>
		</BottomSheet>
	);
};

export default memo(ForceTransfer);
