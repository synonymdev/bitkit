import React, { ReactElement, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useCurrency } from '../../hooks/displayValues';
import { TextInput, View as ThemedView } from '../../styles/components';
import { UnitBitcoinIcon } from '../../styles/icons';
import { BodyMSB, CaptionB } from '../../styles/text';
import { fiatToBitcoinUnit } from '../../utils/conversion';
import { getDisplayValues } from '../../utils/displayValues';
import BaseWidget from './BaseWidget';

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

	const updateFiatAmount = (bitcoin: string) => {
		const amount = Number(bitcoin);
		const dv = getDisplayValues({ satoshis: amount, shouldRoundUpFiat: true });
		setFiatAmount(dv.fiatValue.toString());
	};

	const updateBitcoinAmount = (fiat: string) => {
		const amount = Number(fiat.replace(',', '.'));
		const sats = fiatToBitcoinUnit({ amount });
		setBitcoinAmount(sats.toString());
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
							value={bitcoinAmount}
							placeholder="0"
							keyboardType="number-pad"
							returnKeyType="done"
							onChangeText={(text) => {
								setBitcoinAmount(text);
								updateFiatAmount(text);
							}}
						/>
					</View>
					<CaptionB color="gray1">bitcoin</CaptionB>
				</ThemedView>
				<ThemedView style={styles.row} color="white06">
					<ThemedView style={styles.icon} color="white10">
						<BodyMSB color="brand">{fiatSymbol}</BodyMSB>
					</ThemedView>
					<View style={styles.amount}>
						<TextInput
							style={styles.input}
							value={fiatAmount}
							placeholder="0"
							keyboardType="decimal-pad"
							returnKeyType="done"
							onChangeText={(text) => {
								setFiatAmount(text);
								updateBitcoinAmount(text);
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
