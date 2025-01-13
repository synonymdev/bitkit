import React, { ReactElement, memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import Amount from '../../../components/Amount';
import NavigationHeader from '../../../components/NavigationHeader';
import NumberPad from '../../../components/NumberPad';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useDisplayValues } from '../../../hooks/displayValues';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';
import { customFeeRateSelector } from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import { ETransactionSpeed } from '../../../store/types/settings';
import { View as ThemedView } from '../../../styles/components';
import { BodyM, Caption13Up } from '../../../styles/text';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { TRANSACTION_DEFAULTS } from '../../../utils/wallet/constants';

const FeeCustom = ({
	navigation,
}: SettingsScreenProps<'CustomFee'>): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const customFeeRate = useAppSelector(customFeeRateSelector);
	const [feeRate, setFeeRate] = useState(customFeeRate);

	const avgTransactionSize = TRANSACTION_DEFAULTS.recommendedBaseFee;
	const totalFee = avgTransactionSize * feeRate;
	const totalFeeDisplay = useDisplayValues(totalFee);
	const totalFeeText = useMemo(() => {
		if (totalFeeDisplay.fiatFormatted === '—') {
			return t('general.speed_fee_total', { totalFee });
		}
		return t('general.speed_fee_total_fiat', {
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
		dispatch(
			updateSettings({
				customFeeRate: feeRate,
				transactionSpeed: ETransactionSpeed.custom,
			}),
		);
		navigation.goBack();
	};

	const isValid = feeRate !== 0;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('general.speed_fee_custom')} />
			<View style={styles.container} testID="CustomFee">
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
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						testID="Continue"
						onPress={onContinue}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	container: {
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
