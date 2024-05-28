import React, {
	memo,
	ReactElement,
	useMemo,
	useCallback,
	useState,
	useEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Caption13Up } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';

import { useBalance } from '../../../hooks/wallet';
import { useAppSelector } from '../../../hooks/redux';
import { showToast } from '../../../utils/notifications';
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
import { EFeeId } from 'beignet';
import { getFeeInfo } from '../../../utils/wallet';

const FeeRate = ({ navigation }: SendScreenProps<'FeeRate'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { onchainBalance } = useBalance();
	const selectedWallet = useAppSelector(selectedWalletSelector);
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const transaction = useAppSelector(transactionSelector);
	const feeEstimates = useAppSelector((store) => store.fees.onchain);
	const [maxFee, setMaxFee] = useState(0);
	const selectedFeeId = transaction.selectedFeeId;
	const satsPerByte = transaction.satsPerByte;

	useEffect(() => {
		const feeInfo = getFeeInfo({
			satsPerByte: transaction.satsPerByte,
			transaction,
		});
		if (feeInfo.isOk()) {
			setMaxFee(feeInfo.value.maxSatPerByte);
		}
	}, [transaction]);

	const transactionTotal = useCallback(() => {
		return getTransactionOutputValue({
			outputs: transaction.outputs,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transaction.outputs, selectedNetwork, selectedWallet]);

	const getFee = useCallback(
		(_satsPerByte: number) => {
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message: transaction.message,
			});
		},
		[transaction.message],
	);

	const _updateFee = useCallback(
		(feeId: EFeeId, _satsPerByte: number) => {
			const res = updateFee({
				transaction,
				satsPerByte: _satsPerByte,
				selectedFeeId: feeId,
			});
			if (res.isErr()) {
				showToast({
					type: 'warning',
					title: t('send_fee_error'),
					description: res.error.message,
				});
			}
		},
		[transaction, t],
	);

	const displayFast = useMemo(() => {
		return (
			maxFee >= feeEstimates.fast &&
			(onchainBalance >= transactionTotal() + getFee(feeEstimates.fast) ||
				transaction.max)
		);
	}, [
		maxFee,
		feeEstimates.fast,
		onchainBalance,
		transactionTotal,
		getFee,
		transaction.max,
	]);

	const displayNormal = useMemo(() => {
		return (
			feeEstimates.normal <= maxFee &&
			(onchainBalance >= transactionTotal() + getFee(feeEstimates.normal) ||
				transaction.max)
		);
	}, [
		maxFee,
		feeEstimates.normal,
		onchainBalance,
		transactionTotal,
		getFee,
		transaction.max,
	]);

	const displaySlow = useMemo(() => {
		return (
			maxFee >= feeEstimates.slow &&
			(onchainBalance >= transactionTotal() + getFee(feeEstimates.slow) ||
				transaction.max)
		);
	}, [
		maxFee,
		feeEstimates.slow,
		onchainBalance,
		transactionTotal,
		getFee,
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
				<Caption13Up color="secondary" style={styles.title}>
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
