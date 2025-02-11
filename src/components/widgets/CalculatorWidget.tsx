import React, { ReactElement, useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useCurrency } from '../../hooks/displayValues';
import { TextInput, View as ThemedView } from '../../styles/components';
import { UnitBitcoinIcon } from '../../styles/icons';
import { BodyMSB, CaptionB } from '../../styles/text';
import { fiatToBitcoinUnit } from '../../utils/conversion';
import { getDisplayValues } from '../../utils/displayValues';
import BaseWidget from './BaseWidget';

const MAX_BITCOIN = 2_100_000_000_000_000; // Maximum bitcoin amount in sats

const CalculatorWidget = ({
	isEditing = false,
	style,
	testID,
	onPressIn,
	onLongPress,
}: {
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onPressIn?: () => void;
	onLongPress?: () => void;
}): ReactElement => {
	const { fiatSymbol, fiatTicker } = useCurrency();
	const [bitcoinAmount, setBitcoinAmount] = useState('10000');
	const [fiatAmount, setFiatAmount] = useState<string>(() => {
		const amount = Number(bitcoinAmount);
		const dv = getDisplayValues({ satoshis: amount, shouldRoundUpFiat: true });
		return dv.fiatValue.toString();
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: update fiat amount when currency changes
	useEffect(() => {
		updateFiatAmount(bitcoinAmount);
	}, [fiatTicker]);

	const updateFiatAmount = (bitcoin: string) => {
		// Remove leading zeros for positive numbers
		const sanitizedBitcoin = bitcoin.replace(/^0+(?=\d)/, '');
		const amount = Number(sanitizedBitcoin);
		// Cap the amount at maximum bitcoin
		const cappedAmount = Math.min(amount, MAX_BITCOIN);
		const dv = getDisplayValues({
			satoshis: cappedAmount,
			shouldRoundUpFiat: true,
		});
		setFiatAmount(dv.fiatValue.toString());
		// Update bitcoin amount if it was capped
		if (cappedAmount !== amount) {
			setBitcoinAmount(cappedAmount.toString());
		}
	};

	const updateBitcoinAmount = (fiat: string) => {
		// Remove leading zeros and handle decimal separator
		const sanitizedFiat = fiat.replace(/^0+(?=\d)/, '');
		// Only convert to number if it's not just a decimal point
		const amount = sanitizedFiat === '.' ? 0 : Number(sanitizedFiat);
		const sats = fiatToBitcoinUnit({ amount });
		// Cap the amount at maximum bitcoin
		const cappedSats = Math.min(sats, MAX_BITCOIN);
		setBitcoinAmount(cappedSats.toString());
		// Update fiat amount if bitcoin was capped
		if (cappedSats !== sats) {
			const dv = getDisplayValues({
				satoshis: cappedSats,
				shouldRoundUpFiat: true,
			});
			setFiatAmount(dv.fiatValue.toString());
		}
	};

	const formatNumberWithSeparators = (value: string): string => {
		const endsWithDecimal = value.endsWith('.');
		const cleanNumber = value.replace(/[^\d.]/g, '');
		const [integer, decimal] = cleanNumber.split('.');
		const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

		if (decimal !== undefined) {
			return `${formattedInteger}.${decimal}`;
		}

		return endsWithDecimal ? `${formattedInteger}.` : formattedInteger;
	};

	return (
		<BaseWidget
			id="calculator"
			isEditing={isEditing}
			style={style}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			<View style={styles.container}>
				<ThemedView style={styles.row} color="white06">
					<UnitBitcoinIcon color="brand" />
					<View style={styles.amount}>
						<TextInput
							style={styles.input}
							value={formatNumberWithSeparators(bitcoinAmount)}
							placeholder="0"
							keyboardType="number-pad"
							returnKeyType="done"
							onChangeText={(text) => {
								// Remove any spaces before processing
								const rawText = text.replace(/\s/g, '');
								const sanitizedText = rawText.replace(/^0+(?=\d)/, '');
								setBitcoinAmount(sanitizedText);
								updateFiatAmount(sanitizedText);
							}}
						/>
					</View>
					<CaptionB color="gray1">BTC</CaptionB>
				</ThemedView>
				<ThemedView style={styles.row} color="white06">
					<ThemedView style={styles.icon} color="white10">
						<BodyMSB color="brand">{fiatSymbol}</BodyMSB>
					</ThemedView>
					<View style={styles.amount}>
						<TextInput
							style={styles.input}
							value={formatNumberWithSeparators(fiatAmount)}
							placeholder="0"
							keyboardType="decimal-pad"
							returnKeyType="done"
							onChangeText={(text) => {
								// Process the input text
								const processedText = text
									.replace(',', '.') // Convert comma to dot
									.replace(/\s/g, ''); // Remove spaces

								// Split and clean the number parts
								const [integer, decimal] = processedText.split('.');
								const cleanInteger = integer.replace(/^0+(?=\d)/, '') || '0';

								// Construct the final number
								const finalText =
									decimal !== undefined
										? `${cleanInteger}.${decimal.slice(0, 2)}`
										: cleanInteger;

								// Update state if valid
								if (
									finalText === '' ||
									finalText === '.' ||
									finalText === '0.' ||
									/^\d*\.?\d{0,2}$/.test(finalText)
								) {
									setFiatAmount(finalText);
									updateBitcoinAmount(finalText);
								}
							}}
						/>
					</View>
					<CaptionB color="gray1">{fiatTicker}</CaptionB>
				</ThemedView>
			</View>
		</BaseWidget>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 16,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		height: 64,
		paddingHorizontal: 16,
	},
	icon: {
		borderRadius: 32,
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		width: 32,
	},
	amount: {
		flex: 1,
		marginLeft: 8,
	},
	input: {
		flex: 1,
		backgroundColor: 'transparent',
		marginLeft: -16,
	},
});

export default CalculatorWidget;
