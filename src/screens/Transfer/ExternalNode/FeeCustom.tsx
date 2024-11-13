import React, { ReactElement, memo, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';

import Amount from '../../../components/Amount';
import NavigationHeader from '../../../components/NavigationHeader';
import NumberPad from '../../../components/NumberPad';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useDisplayValues } from '../../../hooks/displayValues';
import { useAppSelector } from '../../../hooks/redux';
import { TransferScreenProps } from '../../../navigation/types';
import { onChainFeesSelector } from '../../../store/reselect/fees';
import { transactionSelector } from '../../../store/reselect/wallet';
import { AnimatedView, View as ThemedView } from '../../../styles/components';
import { BodyM, Caption13Up, Display } from '../../../styles/text';
import { showToast } from '../../../utils/notifications';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { getFeeInfo } from '../../../utils/wallet';
import { getTotalFee, updateFee } from '../../../utils/wallet/transactions';

const FeeCustom = ({
	navigation,
}: TransferScreenProps<'ExternalFeeCustom'>): ReactElement => {
	const { t } = useTranslation('lightning');
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
			return t('wallet:send_fee_total', { totalFee });
		}
		return t('wallet:send_fee_total_fiat', {
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
				title: t('wallet:max_possible_fee_rate'),
				description: t('wallet:max_possible_fee_rate_msg'),
			});
			return;
		}
		if (Number(feeRate) < minFee) {
			showToast({
				type: 'info',
				title: t('wallet:min_possible_fee_rate'),
				description: t('wallet:min_possible_fee_rate_msg'),
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
				title: t('wallet:send_fee_error'),
				description: res.error.message,
			});
		}
		if (res.isOk()) {
			navigation.goBack();
		}
	};

	const isValid = feeRate !== 0;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('external.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content}>
				<Display>
					<Trans
						t={t}
						i18nKey="transfer.custom_fee"
						components={{ accent: <Display color="purple" /> }}
					/>
				</Display>

				<View style={styles.amountContainer}>
					<Caption13Up color="secondary" style={styles.title}>
						{t('sat_vbyte')}
					</Caption13Up>
					<Amount value={feeRate} />
					<View style={styles.feeText}>
						{isValid && (
							<AnimatedView entering={FadeIn} exiting={FadeOut}>
								<BodyM color="secondary">{totalFeeText}</BodyM>
							</AnimatedView>
						)}
					</View>
				</View>

				<View style={styles.numberPadContainer} testID="FeeCustomNumberPad">
					<NumberPad style={styles.numberPad} type="simple" onPress={onPress} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						onPress={onContinue}
						testID="FeeCustomContinue"
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	amountContainer: {
		marginTop: 'auto',
	},
	title: {
		marginBottom: 16,
	},
	feeText: {
		marginTop: 8,
		minHeight: 22, // avoid jumping when fee is changing
	},
	numberPadContainer: {
		flex: 1,
		marginTop: 'auto',
		maxHeight: 360,
	},
	numberPad: {
		marginTop: 16,
		marginHorizontal: -16,
	},
	buttonContainer: {
		justifyContent: 'flex-end',
	},
});

export default memo(FeeCustom);
