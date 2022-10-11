import React, { memo, ReactElement, useCallback } from 'react';
import Summary from './Summary';
import { LayoutAnimation, StyleSheet } from 'react-native';
import { getTransactionOutputValue } from '../../../utils/wallet/transactions';
import { useSelector } from 'react-redux';
import Store from '../../../store/types';
import { View } from '../../../styles/components';
import { useTransactionDetails } from '../../../hooks/transaction';
import useDisplayValues from '../../../hooks/displayValues';
import { ETransactionDefaults } from '../../../store/types/wallet';

const FeeSummary = ({
	amount: _amount = '0',
	lightning = false,
}: {
	amount?: string | number;
	lightning?: boolean;
}): ReactElement => {
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);

	const transaction = useTransactionDetails();

	const totalFee = transaction?.fee || ETransactionDefaults.recommendedBaseFee;

	/*
	 * Retrieves total value of all outputs. Excludes change address.
	 */
	const getAmountToSend = useCallback((): number => {
		try {
			return getTransactionOutputValue({
				selectedWallet,
				selectedNetwork,
			});
		} catch {
			return 0;
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	const amount = Number(_amount) || getAmountToSend();

	const getTransactionTotal = useCallback((): number => {
		try {
			return Number(amount) + Number(totalFee);
		} catch {
			return Number(totalFee);
		}
	}, [amount, totalFee]);

	const transactionTotal = getTransactionTotal();

	const amountDisplay = useDisplayValues(amount);
	const totalFeeDisplay = useDisplayValues(totalFee);
	const transactionTotalDisplay = useDisplayValues(transactionTotal);

	LayoutAnimation.easeInEaseOut();
	return (
		<View color="transparent" style={styles.summary}>
			<Summary
				leftText={lightning ? 'Transfer' : 'Send:'}
				rightText={`${amountDisplay.bitcoinSymbol}${amountDisplay.bitcoinFormatted}\n${amountDisplay.fiatSymbol}${amountDisplay.fiatFormatted}`}
			/>
			<Summary
				leftText={'Fee:'}
				rightText={`${totalFeeDisplay.bitcoinSymbol}${totalFeeDisplay.bitcoinFormatted}\n${totalFeeDisplay.fiatSymbol}${totalFeeDisplay.fiatFormatted}`}
			/>
			<Summary
				leftText={'Total:'}
				rightText={`${transactionTotalDisplay.bitcoinSymbol}${transactionTotalDisplay.bitcoinFormatted}\n${transactionTotalDisplay.fiatSymbol}${transactionTotalDisplay.fiatFormatted}`}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	summary: {
		marginVertical: 20,
	},
});

export default memo(FeeSummary);
