import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { useTranslation } from 'react-i18next';

import { BodyM } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import { closeAllChannels } from '../../utils/lightning';
import { showToast } from '../../utils/notifications';
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
import { Image } from 'react-native';

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
			console.log('trying coop close');
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
				description: closeResponse.error.message,
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
		<BottomSheetWrapper
			view="forceTransfer"
			snapPoints={snapPoints}
			backdrop={true}>
			<View style={styles.root}>
				<BottomSheetNavigationHeader
					title={t('force_title')}
					displayBackButton={false}
				/>

				<BodyM color="secondary">{t('force_text')}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text={t('cancel')}
						onPress={onCancel}
					/>
					<Button
						style={styles.button}
						size="large"
						text={t('force_button')}
						loading={isPending}
						onPress={onContinue}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ForceTransfer);
