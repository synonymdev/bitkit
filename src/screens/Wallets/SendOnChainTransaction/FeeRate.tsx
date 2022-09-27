import React, { memo, ReactElement, useMemo, useCallback } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Caption13Up } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import { EFeeIds } from '../../../store/types/fees';
import { useTransactionDetails } from '../../../hooks/transaction';
import { getBalance } from '../../../utils/wallet';
import {
	getTotalFee,
	getTransactionOutputValue,
	updateFee,
} from '../../../utils/wallet/transactions';
import FeeItem from './FeeItem';

const FeeRate = ({ navigation }): ReactElement => {
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);
	const selectedWallet = useSelector(
		(store: Store) => store.wallet.selectedWallet,
	);
	const selectedNetwork = useSelector(
		(store: Store) => store.wallet.selectedNetwork,
	);
	const feeEstimates = useSelector((store: Store) => store.fees.onchain);
	const balance = useMemo(
		() => getBalance({ selectedWallet, selectedNetwork, onchain: true }),
		[selectedNetwork, selectedWallet],
	);

	const transaction = useTransactionDetails();

	const selectedFeeId = useMemo(
		() => transaction?.selectedFeeId,
		[transaction?.selectedFeeId],
	);

	const transactionTotal = useCallback(() => {
		return getTransactionOutputValue({
			selectedWallet,
			selectedNetwork,
			outputs: transaction.outputs,
		});
	}, [selectedNetwork, selectedWallet, transaction.outputs]);

	const satsPerByte = useMemo(
		(): number => transaction?.satsPerByte ?? 1,
		[transaction?.satsPerByte],
	);

	const getFee = useCallback(
		(_satsPerByte = 1) => {
			const message = transaction?.message;
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message,
				selectedWallet,
				selectedNetwork,
			});
		},
		[selectedNetwork, selectedWallet, transaction?.message],
	);

	const _updateFee = useCallback(
		(feeId, _satsPerByte) => {
			const res = updateFee({
				selectedWallet,
				selectedNetwork,
				transaction,
				satsPerByte: _satsPerByte,
				selectedFeeId: feeId,
			});
			if (res.isErr()) {
				return Alert.alert('Fee update error', res.error.message);
			}
		},
		[selectedNetwork, selectedWallet, transaction],
	);

	const displayInstant = useMemo(() => false, []); //TODO: Determine if the user can pay via Lightning.
	const displayFast = useMemo(() => {
		return balance.satoshis >= transactionTotal() + getFee(feeEstimates.fast);
	}, [balance.satoshis, feeEstimates.fast, getFee, transactionTotal]);
	const displayNormal = useMemo(
		() =>
			balance.satoshis >= transactionTotal() + getFee(feeEstimates.normal) &&
			feeEstimates.fast > feeEstimates.normal,
		[
			balance.satoshis,
			feeEstimates.fast,
			feeEstimates.normal,
			getFee,
			transactionTotal,
		],
	);
	const displaySlow = useMemo(
		() =>
			balance.satoshis >= transactionTotal() + getFee(feeEstimates.slow) &&
			feeEstimates.normal > feeEstimates.slow,
		[
			balance.satoshis,
			feeEstimates.normal,
			feeEstimates.slow,
			getFee,
			transactionTotal,
		],
	);
	const displayCustom = useMemo(
		() => balance.satoshis >= transactionTotal() + getFee(1),
		[balance.satoshis, getFee, transactionTotal],
	);

	const isSelected = useCallback((id) => id === selectedFeeId, [selectedFeeId]);

	const onCardPress = useCallback(
		async (feeId: EFeeIds, fee = 1) => {
			await _updateFee(feeId, fee);
		},
		[_updateFee],
	);

	const onCustomPress = useCallback(async () => {
		await onCardPress(EFeeIds.custom, satsPerByte);
		navigation.navigate('FeeCustom');
	}, [satsPerByte, navigation, onCardPress]);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Speed" />
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					SPEED AND FEE
				</Caption13Up>

				{displayInstant && (
					<FeeItem
						id={EFeeIds.instant}
						sats={0}
						onPress={(): void => {}}
						isSelected={false}
					/>
				)}
				{displayFast && (
					<FeeItem
						id={EFeeIds.fast}
						sats={getFee(feeEstimates.fast)}
						onPress={(): void => {
							onCardPress(EFeeIds.fast, feeEstimates.fast).then();
						}}
						isSelected={isSelected(EFeeIds.fast)}
					/>
				)}
				{displayNormal && (
					<FeeItem
						id={EFeeIds.normal}
						sats={getFee(feeEstimates.normal)}
						onPress={(): void => {
							onCardPress(EFeeIds.normal, feeEstimates.normal).then();
						}}
						isSelected={isSelected(EFeeIds.normal)}
					/>
				)}
				{displaySlow && (
					<FeeItem
						id={EFeeIds.slow}
						sats={getFee(feeEstimates.slow)}
						onPress={(): void => {
							onCardPress(EFeeIds.slow, feeEstimates.slow).then();
						}}
						isSelected={isSelected(EFeeIds.slow)}
					/>
				)}
				{displayCustom && (
					<FeeItem
						id={EFeeIds.custom}
						sats={selectedFeeId === EFeeIds.custom ? getFee(satsPerByte) : 0}
						onPress={onCustomPress}
						isSelected={isSelected(EFeeIds.custom)}
					/>
				)}
				<View style={nextButtonContainer}>
					<Button
						size="large"
						text="Next"
						disabled={
							selectedFeeId === EFeeIds.none || selectedFeeId === EFeeIds.custom
						}
						onPress={(): void => navigation.navigate('ReviewAndSend')}
					/>
				</View>
			</View>
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
	nextButtonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 16,
	},
});

export default memo(FeeRate);
