import React, { ReactElement, memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Caption13Up, Text01M } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import { useTransactionDetails } from '../../../hooks/transaction';
import FeeCustomToggle from './FeeCustomToggle';
import FeeNumberPad from './FeeNumberPad';
import { getTotalFee } from '../../../utils/wallet/transactions';
import useDisplayValues from '../../../hooks/displayValues';
import type { SendScreenProps } from '../../../navigation/types';

const FeeCustom = ({
	navigation,
}: SendScreenProps<'FeeCustom'>): ReactElement => {
	const transaction = useTransactionDetails();

	const getFee = useCallback(
		(_satsPerByte = 1) => {
			const message = transaction?.message;
			return getTotalFee({
				satsPerByte: _satsPerByte,
				message,
			});
		},
		[transaction?.message],
	);

	const feeSats = useMemo(
		() => getFee(transaction.satsPerByte),
		[getFee, transaction.satsPerByte],
	);
	const totalFeeDisplay = useDisplayValues(feeSats);
	const feeAmount = useMemo(
		() =>
			totalFeeDisplay.fiatFormatted !== '—'
				? ` (${totalFeeDisplay.fiatSymbol} ${totalFeeDisplay.fiatFormatted})`
				: '',
		[totalFeeDisplay.fiatFormatted, totalFeeDisplay.fiatSymbol],
	);

	let onDone: (() => void) | undefined;

	if (transaction.satsPerByte !== 0) {
		onDone = (): void => {
			navigation.navigate('ReviewAndSend');
		};
	}

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader
				title="Set Custom Fee"
				displayBackButton={transaction.satsPerByte !== 0}
			/>
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					SAT / VBYTE
				</Caption13Up>
				<FeeCustomToggle />
				<Text01M style={styles.text} color="white5">
					{feeSats} sats for this transaction{feeAmount}
				</Text01M>
				<FeeNumberPad style={styles.numberPad} onDone={onDone} />
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
		marginTop: 'auto',
		maxHeight: 425,
	},
});

export default memo(FeeCustom);
