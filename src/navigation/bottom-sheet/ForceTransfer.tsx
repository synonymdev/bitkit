import React, { memo, ReactElement, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Text01S } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import { toggleView } from '../../store/actions/ui';
import GlowImage from '../../components/GlowImage';
import { addTodo, removeTodo } from '../../store/actions/todos';
import { closeAllChannels } from '../../utils/lightning';
import Store from '../../store/types';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../utils/notifications';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const RETRY_INTERVAL = 1000 * 60 * 5;
const GIVE_UP = 1000 * 60 * 30;

const ForceTransfer = (): ReactElement => {
	const snapPoints = useSnapPoints('large');
	const insets = useSafeAreaInsets();
	const startTime = useSelector(
		(state: Store) => state.user.startCoopCloseTimestamp,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('forceTransfer');

	console.log({ startTime });

	// try to cooperatively close the channel(s) for 30min
	useEffect(() => {
		let interval;

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
					clearInterval(interval);
					removeTodo('transferClosingChannel');
					addTodo('transferInProgress');
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
				clearInterval(interval);
				toggleView({
					view: 'forceTransfer',
					data: { isOpen: true },
				});
				return;
			}

			tryChannelCoopClose();
		}, RETRY_INTERVAL);

		return (): void => {
			clearInterval(interval);
		};
	}, [selectedNetwork, selectedWallet, startTime]);

	const onCancel = (): void => {
		toggleView({
			view: 'forceTransfer',
			data: { isOpen: false },
		});
	};

	const onContinue = async (): Promise<void> => {
		console.log('trying force close...');

		const closeResponse = await closeAllChannels({
			force: true,
			selectedNetwork,
			selectedWallet,
		});
		if (closeResponse.isErr()) {
			showErrorNotification({
				title: 'Channel Close Error',
				message: closeResponse.error.message,
			});
			return;
		}
		if (closeResponse.isOk()) {
			if (closeResponse.value.length === 0) {
				console.log('force close success.');
				showSuccessNotification({
					title: 'Force Transfer Initiated',
					message: 'Your funds will be accessible in ±14 days.',
				});

				removeTodo('transferClosingChannel');
				addTodo('transferInProgress');

				toggleView({
					view: 'forceTransfer',
					data: { isOpen: false },
				});
			} else {
				console.log('force close failed.');
				showErrorNotification({
					title: 'Force Transfer Failed',
					message: 'Something went wrong when trying to close the channel.',
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
					title="Force Transfer"
					displayBackButton={false}
				/>

				<Text01S color="gray1">
					Could not initiate transfer. Do you want to force this transfer? You
					won’t be able to use these funds for ±14 days (!)
				</Text01S>

				<GlowImage image={imageSrc} imageSize={205} glowColor="yellow" />

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						variant="secondary"
						size="large"
						text="Later"
						onPress={onCancel}
					/>
					<View style={styles.divider} />
					<Button
						style={styles.button}
						size="large"
						text="Force Transfer"
						onPress={onContinue}
					/>
				</View>
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
