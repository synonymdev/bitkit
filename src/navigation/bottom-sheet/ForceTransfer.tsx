import React, { memo, ReactElement, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Text01S } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import { closeBottomSheet, showBottomSheet } from '../../store/actions/ui';
import GlowImage from '../../components/GlowImage';
import { addTodo, removeTodo } from '../../store/actions/todos';
import { closeAllChannels } from '../../utils/lightning';
import { showToast } from '../../utils/notifications';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../../store/reselect/wallet';
import { startCoopCloseTimestampSelector } from '../../store/reselect/user';
import { clearCoopCloseTimer } from '../../store/actions/user';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const RETRY_INTERVAL = 1000 * 60 * 5;
const GIVE_UP = 1000 * 60 * 30;

const ForceTransfer = (): ReactElement => {
	const { t } = useTranslation('lightning');
	const snapPoints = useSnapPoints('large');
	const startTime = useSelector(startCoopCloseTimestampSelector);
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	useBottomSheetBackPress('forceTransfer');

	// try to cooperatively close the channel(s) for 30min
	useEffect(() => {
		let interval: NodeJS.Timer;

		if (!startTime) {
			return;
		}

		const tryChannelCoopClose = async (): Promise<void> => {
			console.log('trying coop close');
			const closeResponse = await closeAllChannels({
				selectedNetwork,
				selectedWallet,
			});
			if (closeResponse.isErr()) {
				console.log('coop close failed.');
			}
			if (closeResponse.isOk()) {
				if (closeResponse.value.length === 0) {
					console.log('coop close success.');
					clearCoopCloseTimer();
					clearInterval(interval);
					removeTodo('transferClosingChannel');
					addTodo('transferToSavings');
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
				clearCoopCloseTimer();
				clearInterval(interval);
				showBottomSheet('forceTransfer');
				return;
			}

			tryChannelCoopClose();
		}, RETRY_INTERVAL);

		return (): void => {
			clearInterval(interval);
		};
	}, [selectedNetwork, selectedWallet, startTime]);

	const onCancel = (): void => {
		closeBottomSheet('forceTransfer');
	};

	const onContinue = async (): Promise<void> => {
		console.log('trying force close...');

		const closeResponse = await closeAllChannels({
			force: true,
			selectedNetwork,
			selectedWallet,
		});
		if (closeResponse.isErr()) {
			showToast({
				type: 'error',
				title: t('close_error'),
				description: closeResponse.error.message,
			});
			return;
		}
		if (closeResponse.isOk()) {
			if (closeResponse.value.length === 0) {
				console.log('force close success.');
				showToast({
					type: 'success',
					title: t('force_init_title'),
					description: t('force_init_msg'),
				});

				removeTodo('transferClosingChannel');
				addTodo('transferToSavings');
				closeBottomSheet('forceTransfer');
			} else {
				console.log('force close failed.');
				showToast({
					type: 'error',
					title: t('force_failed_title'),
					description: t('force_failed_msg'),
				});
				console.log({ closeResponse: closeResponse.value });
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

				<Text01S color="gray1">{t('force_text')}</Text01S>

				<GlowImage image={imageSrc} imageSize={205} glowColor="yellow" />

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text={t('cancel')}
						onPress={onCancel}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text={t('force_button')}
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
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(ForceTransfer);
