import React, { memo, ReactElement } from 'react';
import { StyleSheet, GestureResponderEvent } from 'react-native';
import { useSelector } from 'react-redux';

import { TouchableOpacity, View, SwitchIcon } from '../../styles/components';
import Store from '../../store/types';
import { sendMax } from '../../utils/wallet/transactions';
import { Text02B } from '../../styles/components';
import { getStore } from '../../store/helpers';
import { updateSettings } from '../../store/actions/settings';
import useDisplayValues from '../../hooks/displayValues';

type AmountButtonRowProps = {
	showMaxButton?: boolean;
	onDone: (event: GestureResponderEvent) => void;
};

const AmountButtonRow = ({
	showMaxButton = true,
	onDone,
}: AmountButtonRowProps): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);

	const balance = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.balance[selectedNetwork],
	);

	const unitPreference = useSelector(
		(state: Store) => state.settings.unitPreference,
	);

	const displayValues = useDisplayValues(balance);

	const max = useSelector(
		(state: Store) =>
			state.wallet.wallets[selectedWallet]?.transaction[selectedNetwork]?.max ??
			false,
	);

	const onChangeUnit = (): void => {
		const unit =
			getStore().settings?.unitPreference === 'asset' ? 'fiat' : 'asset';
		updateSettings({ unitPreference: unit });
	};

	return (
		<View style={styles.container}>
			<View style={styles.buttonContainer}>
				{showMaxButton && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						disabled={balance <= 0}
						onPress={sendMax}>
						<Text02B size="12px" color={max ? 'orange' : 'brand'}>
							MAX
						</Text02B>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={styles.button}
					color="white08"
					onPress={onChangeUnit}>
					<SwitchIcon color="brand" width={16.44} height={13.22} />
					<Text02B size="12px" color="brand" style={styles.middleButtonText}>
						{unitPreference === 'asset'
							? displayValues.fiatTicker
							: displayValues.bitcoinTicker}
					</Text02B>
				</TouchableOpacity>
			</View>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={styles.button}
					color="white08"
					onPress={onDone}>
					<Text02B size="12px" color="brand">
						DONE
					</Text02B>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingTop: 15,
		justifyContent: 'space-evenly',
	},
	buttonContainer: {
		flex: 1,
		alignItems: 'center',
	},
	button: {
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	middleButtonText: {
		marginLeft: 11,
	},
});

export default memo(AmountButtonRow);
