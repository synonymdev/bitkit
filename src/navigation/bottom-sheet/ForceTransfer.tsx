import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S } from '../../styles/components';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import Button from '../../components/Button';
import { toggleView } from '../../store/actions/user';
import GlowImage from '../../components/GlowImage';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
// import { closeChannel } from '../../utils/lightning';
// import { showErrorNotification } from '../../utils/notifications';
import { addTodo, removeTodo } from '../../store/actions/todos';
import { closeAllChannels } from '../../utils/lightning';
import { useSelector } from 'react-redux';
import Store from '../../store/types';
import { showErrorNotification } from '../../utils/notifications';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const ForceTransfer = (): ReactElement => {
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);

	const snapPoints = useSnapPoints('large');
	const insets = useSafeAreaInsets();

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('forceTransfer');

	const onCancel = (): void => {
		toggleView({
			view: 'forceTransfer',
			data: { isOpen: false },
		});
	};

	const onContinue = async (): Promise<void> => {
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
		removeTodo('transferClosingChannel');
		addTodo('transferInProgress');

		toggleView({
			view: 'forceTransfer',
			data: { isOpen: false },
		});
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
