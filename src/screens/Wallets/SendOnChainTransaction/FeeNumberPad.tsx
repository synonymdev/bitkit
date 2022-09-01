import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useSelector } from 'react-redux';

import NumberPad from '../../../components/NumberPad';
import { View, TouchableOpacity, Text02B } from '../../../styles/components';
import BottomSheetWrapper from '../../../components/BottomSheetWrapper';
import Store from '../../../store/types';
import { useTransactionDetails } from '../../../hooks/transaction';
import { updateFee } from '../../../utils/wallet/transactions';
import { toggleView } from '../../../store/actions/user';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';

/**
 * Handles the number pad logic (add/remove/clear) for on-chain fee.
 */
const FeeNumberPad = (): ReactElement => {
	const snapPoints = useMemo(() => [375], []);

	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const transaction = useTransactionDetails();

	useBottomSheetBackPress('numberPadFee');

	// Add, shift and update the current transaction amount based on the provided fiat value or bitcoin unit.
	const onPress = (key): void => {
		let amount = String(transaction.satsPerByte);
		amount = `${amount}${key}`;

		const res = updateFee({
			satsPerByte: Number(amount),
			selectedWallet,
			selectedNetwork,
			transaction,
		});
		if (res.isErr()) {
			Alert.alert(res.error.message);
		}
	};

	// Shift, remove and update the current transaction amount based on the provided fiat value or bitcoin unit.
	const onRemove = (): void => {
		let amount = String(transaction.satsPerByte);
		amount = amount.substr(0, amount.length - 1);
		if (amount.length === 0) {
			amount = '0';
		}

		const res = updateFee({
			satsPerByte: Number(amount),
			selectedWallet,
			selectedNetwork,
			transaction,
		});
		if (res.isErr()) {
			Alert.alert(res.error.message);
		}
	};

	const onClear = (): void => {
		const res = updateFee({
			satsPerByte: 0,
			selectedWallet,
			selectedNetwork,
			transaction,
		});
		if (res.isErr()) {
			Alert.alert(res.error.message);
		}
	};

	return (
		<BottomSheetWrapper
			snapPoints={snapPoints}
			backdrop={false}
			view="numberPadFee">
			<NumberPad onPress={onPress} onRemove={onRemove} onClear={onClear}>
				<View style={styles.topRow}>
					<TouchableOpacity
						style={styles.topRowButtons}
						color="onSurface"
						onPress={(): void => {
							toggleView({ view: 'numberPadFee', data: { isOpen: false } });
						}}>
						<Text02B size="12px" color="brand">
							DONE
						</Text02B>
					</TouchableOpacity>
				</View>
			</NumberPad>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingVertical: 5,
		paddingHorizontal: 5,
	},
	topRowButtons: {
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(FeeNumberPad);
