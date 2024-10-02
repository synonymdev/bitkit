import React, { memo, ReactElement, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Display } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetScreen from '../../components/BottomSheetScreen';
import { closeAllChannels } from '../../utils/lightning';
import { showToast } from '../../utils/notifications';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { closeSheet } from '../../store/slices/ui';
import { showBottomSheet } from '../../store/utils/ui';
import { clearCoopCloseTimer } from '../../store/slices/user';
import { startCoopCloseTimestampSelector } from '../../store/reselect/user';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const RETRY_INTERVAL = 1000 * 60 * 5;
const GIVE_UP = 1000 * 60 * 30;

const ForceTransfer = (): ReactElement => {
	const { t } = useTranslation('lightning');
	const snapPoints = useSnapPoints('large');
	const dispatch = useAppDispatch();
	const startTime = useAppSelector(startCoopCloseTimestampSelector);
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const [isPending, setIsPending] = useState(false);

	useBottomSheetBackPress('forceTransfer');

	// try to cooperatively close the channel(s) for 30min
	useEffect(() => {
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
				showBottomSheet('forceTransfer');
				return;
			}

			tryChannelCoopClose();
		}, RETRY_INTERVAL);

		return (): void => {
			clearInterval(interval);
		};
	}, [selectedNetwork, selectedWallet, startTime, dispatch]);

	const onCancel = (): void => {
		dispatch(closeSheet('forceTransfer'));
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
				dispatch(closeSheet('forceTransfer'));
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
		<BottomSheetWrapper view="forceTransfer" snapPoints={snapPoints}>
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
		</BottomSheetWrapper>
	);
};

export default memo(ForceTransfer);
