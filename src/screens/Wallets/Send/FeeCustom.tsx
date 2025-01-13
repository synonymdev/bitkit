import React, { ReactElement, memo, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Amount from '../../../components/Amount';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import NumberPad from '../../../components/NumberPad';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useDisplayValues } from '../../../hooks/displayValues';
import { useAppSelector } from '../../../hooks/redux';
import type { SendScreenProps } from '../../../navigation/types';
import { onChainFeesSelector } from '../../../store/reselect/fees';
import { transactionSelector } from '../../../store/reselect/wallet';
import { BodyM, Caption13Up } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { getFeeInfo } from '../../../utils/wallet';
import { getTotalFee, updateFee } from '../../../utils/wallet/transactions';

const FeeCustom = ({
	navigation,
}: SendScreenProps<'FeeCustom'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const feeEstimates = useAppSelector(onChainFeesSelector);
	const transaction = useAppSelector(transactionSelector);
	const [feeRate, setFeeRate] = useState<number>(transaction.satsPerByte);
	const [maxFee, setMaxFee] = useState(0);
	const minFee = feeEstimates.minimum;

	useEffect(() => {
		const feeInfo = getFeeInfo({
			satsPerByte: transaction.satsPerByte,
			transaction,
		});
		if (feeInfo.isOk()) {
			setMaxFee(feeInfo.value.maxSatPerByte);
		}
	}, [transaction]);

	const totalFee = getTotalFee({
		satsPerByte: feeRate,
		message: transaction.message,
	});

	const totalFeeDisplay = useDisplayValues(totalFee);
	const totalFeeText = useMemo(() => {
		if (totalFeeDisplay.fiatFormatted === '—') {
			return t('send_fee_total', { totalFee });
		}
		return t('send_fee_total_fiat', {
			feeSats: totalFee,
			fiatSymbol: totalFeeDisplay.fiatSymbol,
			fiatFormatted: totalFeeDisplay.fiatFormatted,
		});
	}, [totalFee, totalFeeDisplay.fiatFormatted, totalFeeDisplay.fiatSymbol, t]);

	const onPress = (key: string): void => {
		const current = feeRate.toString();
		const newAmount = handleNumberPadPress(key, current, { maxLength: 3 });
		setFeeRate(Number(newAmount));
	};

	const onContinue = (): void => {
		if (Number(feeRate) > maxFee) {
			showToast({
				type: 'info',
				title: t('max_possible_fee_rate'),
				description: t('max_possible_fee_rate_msg'),
			});
			return;
		}
		if (Number(feeRate) < minFee) {
			showToast({
				type: 'info',
				title: t('min_possible_fee_rate'),
				description: t('min_possible_fee_rate_msg'),
			});
			return;
		}
		const res = updateFee({
			satsPerByte: Number(feeRate),
			transaction,
		});
		if (res.isErr()) {
			showToast({
				type: 'warning',
				title: t('send_fee_error'),
				description: res.error.message,
			});
		}
		if (res.isOk()) {
			navigation.goBack();
		}
	};

	const isValid = feeRate !== 0;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('send_fee_custom')} />
			<View style={styles.content}>
				<Caption13Up color="secondary" style={styles.title}>
					{t('sat_vbyte')}
				</Caption13Up>
				<Amount value={feeRate} />

				{isValid && (
					<BodyM style={styles.text} color="secondary">
						{totalFeeText}
					</BodyM>
				)}

				<NumberPad style={styles.numberPad} type="simple" onPress={onPress} />

				<View style={styles.buttonContainer}>
					<Button size="large" text={t('continue')} onPress={onContinue} />
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
		paddingHorizontal: 16,
	},
	title: {
		marginBottom: 16,
	},
	text: {
		marginTop: 8,
	},
	numberPad: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 360,
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(FeeCustom);
