import React, { ReactElement, memo, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Caption13Up, Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import Amount from '../../../components/Amount';
import NumberPad from '../../../components/NumberPad';
import { getTotalFee, updateFee } from '../../../utils/wallet/transactions';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { showErrorNotification } from '../../../utils/notifications';
import useDisplayValues from '../../../hooks/displayValues';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
	transactionSelector,
} from '../../../store/reselect/wallet';
import type { SendScreenProps } from '../../../navigation/types';

const FeeCustom = ({
	navigation,
}: SendScreenProps<'FeeCustom'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const insets = useSafeAreaInsets();
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const transaction = useSelector(transactionSelector);
	const [feeRate, setFeeRate] = useState(transaction.satsPerByte);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

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
		const res = updateFee({
			satsPerByte: Number(feeRate),
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
					<Text01S style={styles.text} color="white5">
						{totalFeeText}
					</Text01S>
				)}

				<NumberPad style={styles.numberPad} type="simple" onPress={onPress} />

				<View style={buttonContainerStyles}>
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						onPress={onContinue}
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
