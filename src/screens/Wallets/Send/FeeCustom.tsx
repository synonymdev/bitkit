import React, { ReactElement, memo, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Caption13Up, Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import Amount from '../../../components/Amount';
import NumberPad from '../../../components/NumberPad';
import { getTotalFee, updateFee } from '../../../utils/wallet/transactions';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { showToast } from '../../../utils/notifications';
import { useAppSelector } from '../../../hooks/redux';
import { useDisplayValues } from '../../../hooks/displayValues';
import { transactionSelector } from '../../../store/reselect/wallet';
import type { SendScreenProps } from '../../../navigation/types';
import { getFeeInfo } from '../../../utils/wallet';

const FeeCustom = ({
	navigation,
}: SendScreenProps<'FeeCustom'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const transaction = useAppSelector(transactionSelector);
	const [feeRate, setFeeRate] = useState(transaction.satsPerByte);
	const [maxFee, setMaxFee] = useState(0);

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
		if (Number(newAmount) > maxFee) {
			showToast({
				type: 'info',
				title: t('max_possible_fee_rate'),
				description: `${maxFee} ${t('sats_per_vbyte')}`,
			});
			return;
		}
		setFeeRate(Number(newAmount));
	};

	const onContinue = (): void => {
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
				<Caption13Up color="gray1" style={styles.title}>
					{t('sat_vbyte')}
				</Caption13Up>
				<Amount value={feeRate} />

				{isValid && (
					<Text01S style={styles.text} color="white50">
						{totalFeeText}
					</Text01S>
				)}

				<NumberPad style={styles.numberPad} type="simple" onPress={onPress} />

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						onPress={onContinue}
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
