import React, { memo, ReactElement } from 'react';
import { useSelector } from 'react-redux';

import NumberPad from '../../../components/NumberPad';
import Store from '../../../store/types';
import { useTransactionDetails } from '../../../hooks/transaction';
import { updateFee } from '../../../utils/wallet/transactions';
import NumberPadButtons from '../NumberPadButtons';
import { showErrorNotification } from '../../../utils/notifications';

/**
 * Handles the number pad logic (add/remove/clear) for on-chain fee.
 */
const FeeNumberPad = ({
	style,
	onDone,
}: {
	style?: object | Array<object>;
	onDone?: () => void;
}): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const transaction = useTransactionDetails();

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
			showErrorNotification({
				title: 'Error Updating Fee',
				message: res.error.message,
			});
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
			showErrorNotification({
				title: 'Error Updating Fee',
				message: res.error.message,
			});
		}
	};

	return (
		<NumberPad
			style={style}
			type="integer"
			onPress={onPress}
			onRemove={onRemove}>
			<NumberPadButtons showUnitButton={false} onDone={onDone} />
		</NumberPad>
	);
};

export default memo(FeeNumberPad);
