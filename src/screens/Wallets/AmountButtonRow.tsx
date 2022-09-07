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
		<View style={styles.topRow}>
			<View style={styles.buttonContainer}>
				{showMaxButton && (
					<TouchableOpacity
						style={styles.topRowButtons}
						color={'onSurface'}
						disabled={balance <= 0}
						onPress={sendMax}>
						<Text02B size="12px" color={max ? 'orange' : 'brand'}>
							MAX
						</Text02B>
					</TouchableOpacity>
				)}

				<TouchableOpacity
					color={'onSurface'}
					style={styles.topRowButtons}
					onPress={onChangeUnit}>
					<SwitchIcon color="brand" width={16.44} height={13.22} />
					<Text02B size="12px" color="brand" style={styles.middleButtonText}>
						{unitPreference === 'asset'
							? displayValues.fiatTicker
							: displayValues.bitcoinTicker}
					</Text02B>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.topRowButtons}
					color={'onSurface'}
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
	buttonContainer: {
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'space-around',
	},
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 0,
		paddingTop: 15,
	},
	topRowButtons: {
		paddingVertical: 6,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	middleButtonText: {
		marginLeft: 11,
	},
});

export default memo(AmountButtonRow);
