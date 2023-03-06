import React, { memo, ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import NumberPad from '../../../components/NumberPad';
import { updateFee } from '../../../utils/wallet/transactions';
import { showErrorNotification } from '../../../utils/notifications';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';

/**
 * Handles the number pad logic (add/remove/clear) for on-chain fee.
 */
const FeeNumberPad = ({
	style,
}: {
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const transaction = useSelector(transactionSelector);

	// Add, shift and update the current transaction amount based on the provided fiat value or bitcoin unit.
	const onPress = (key: string | number): void => {
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
				title: t('send_fee_error'),
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
				title: t('send_fee_error'),
				message: res.error.message,
			});
		}
	};

	return (
		<NumberPad
			style={style}
			type="integer"
			onPress={onPress}
			onRemove={onRemove}
		/>
	);
};

export default memo(FeeNumberPad);
