import React, { ReactElement, memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Caption13Up, Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import FeeCustomToggle from './FeeCustomToggle';
import FeeNumberPad from './FeeNumberPad';
import { getTotalFee } from '../../../utils/wallet/transactions';
import useDisplayValues from '../../../hooks/displayValues';
import { transactionSelector } from '../../../store/reselect/wallet';
import type { SendScreenProps } from '../../../navigation/types';

const FeeCustom = ({
	navigation,
}: SendScreenProps<'FeeCustom'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const insets = useSafeAreaInsets();
	const transaction = useSelector(transactionSelector);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const getFee = useCallback(
		(_satsPerByte: number) => {
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message: transaction.message,
			});
		},
		[transaction.message],
	);

	const feeSats = useMemo(
		() => getFee(transaction.satsPerByte),
		[getFee, transaction.satsPerByte],
	);
	const totalFeeDisplay = useDisplayValues(feeSats);
	const feeTotal = useMemo(() => {
		if (totalFeeDisplay.fiatFormatted === '—') {
			return t('send_fee_total', { feeSats });
		}
		return t('send_fee_total_fiat', {
			feeSats,
			fiatSymbol: totalFeeDisplay.fiatSymbol,
			fiatFormatted: totalFeeDisplay.fiatFormatted,
		});
	}, [feeSats, totalFeeDisplay.fiatFormatted, totalFeeDisplay.fiatSymbol, t]);

	const isValid = transaction.satsPerByte !== 0;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('send_fee_custom')}
				displayBackButton={isValid}
			/>
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					{t('sat_vbyte')}
				</Caption13Up>
				<FeeCustomToggle />
				<Text01S style={styles.text} color="white5">
					{feeTotal}
				</Text01S>

				<FeeNumberPad style={styles.numberPad} />

				<View style={buttonContainerStyles}>
					<Button
						size="large"
						text={t('continue')}
						disabled={!isValid}
						onPress={(): void => navigation.goBack()}
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
