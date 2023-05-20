import React, { memo, ReactElement, useMemo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { Caption13Up } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import { EFeeId } from '../../../store/types/fees';
import { useBalance } from '../../../hooks/wallet';
import { showErrorNotification } from '../../../utils/notifications';
import {
	getTotalFee,
	getTransactionOutputValue,
	updateFee,
} from '../../../utils/wallet/transactions';
import FeeItem from './FeeItem';
import type { SendScreenProps } from '../../../navigation/types';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import SafeAreaInset from '../../../components/SafeAreaInset';

const FeeRate = ({ navigation }: SendScreenProps<'FeeRate'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { onchainBalance } = useBalance();
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const transaction = useSelector(transactionSelector);
	const feeEstimates = useSelector((store: Store) => store.fees.onchain);

	const selectedFeeId = transaction.selectedFeeId;
	const satsPerByte = transaction.satsPerByte;

	const transactionTotal = useCallback(() => {
		return getTransactionOutputValue({
			selectedWallet,
			selectedNetwork,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	const getFee = useCallback(
		(_satsPerByte: number) => {
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message: transaction.message,
				selectedWallet,
				selectedNetwork,
			});
		},
		[transaction.message, selectedNetwork, selectedWallet],
	);

	const _updateFee = useCallback(
		(feeId: EFeeId, _satsPerByte: number) => {
			const res = updateFee({
				selectedWallet,
				selectedNetwork,
				transaction,
				satsPerByte: _satsPerByte,
				selectedFeeId: feeId,
			});
			if (res.isErr()) {
				showErrorNotification({
					title: t('send_fee_error'),
					message: res.error.message,
				});
			}
		},
		[selectedNetwork, selectedWallet, transaction, t],
	);

	const displayFast = useMemo(() => {
		return (
			onchainBalance >= transactionTotal() + getFee(feeEstimates.fast) ||
			transaction.max
		);
	}, [
		onchainBalance,
		feeEstimates.fast,
		getFee,
		transactionTotal,
		transaction.max,
	]);

	const displayNormal = useMemo(() => {
		return (
			onchainBalance >= transactionTotal() + getFee(feeEstimates.normal) ||
			transaction.max
		);
	}, [
		onchainBalance,
		feeEstimates.normal,
		getFee,
		transactionTotal,
		transaction.max,
	]);

	const displaySlow = useMemo(() => {
		return (
			onchainBalance >= transactionTotal() + getFee(feeEstimates.slow) ||
			transaction.max
		);
	}, [
		onchainBalance,
		feeEstimates.slow,
		getFee,
		transactionTotal,
		transaction.max,
	]);

	const displayCustom = useMemo(() => {
		return onchainBalance >= transactionTotal() + getFee(1) || transaction.max;
	}, [onchainBalance, getFee, transactionTotal, transaction.max]);

	const isSelected = useCallback(
		(id: EFeeId) => id === selectedFeeId,
		[selectedFeeId],
	);

	const onCardPress = useCallback(
		(feeId: EFeeId, fee: number) => {
			_updateFee(feeId, fee);
			navigation.goBack();
		},
		[_updateFee, navigation],
	);

	const onCustomPress = useCallback(() => {
		onCardPress(EFeeId.custom, satsPerByte);
		navigation.navigate('FeeCustom');
	}, [satsPerByte, navigation, onCardPress]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('send_fee_speed')} />
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					{t('send_fee_and_speed')}
				</Caption13Up>

				{displayFast && (
					<FeeItem
						id={EFeeId.fast}
						sats={getFee(feeEstimates.fast)}
						isSelected={isSelected(EFeeId.fast)}
						onPress={(): void => {
							onCardPress(EFeeId.fast, feeEstimates.fast);
						}}
					/>
				)}
				{displayNormal && (
					<FeeItem
						id={EFeeId.normal}
						sats={getFee(feeEstimates.normal)}
						isSelected={isSelected(EFeeId.normal)}
						onPress={(): void => {
							onCardPress(EFeeId.normal, feeEstimates.normal);
						}}
					/>
				)}
				{displaySlow && (
					<FeeItem
						id={EFeeId.slow}
						sats={getFee(feeEstimates.slow)}
						isSelected={isSelected(EFeeId.slow)}
						onPress={(): void => {
							onCardPress(EFeeId.slow, feeEstimates.slow);
						}}
					/>
				)}
				{displayCustom && (
					<FeeItem
						id={EFeeId.custom}
						sats={selectedFeeId === EFeeId.custom ? getFee(satsPerByte) : 0}
						isSelected={isSelected(EFeeId.custom)}
						onPress={onCustomPress}
					/>
				)}
				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						disabled={selectedFeeId === EFeeId.none}
						onPress={(): void => navigation.navigate('ReviewAndSend')}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	title: {
		marginBottom: 16,
		marginLeft: 16,
	},
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 16,
	},
});

export default memo(FeeRate);
