import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import NumberPad from '../../components/NumberPad';
import { useExchangeRate } from '../../hooks/displayValues';
import useDisplayValues from '../../hooks/displayValues__deprecated';
import { fiatToBitcoinUnit } from '../../utils/exchange-rate';
import { btcToSats } from '../../utils/helpers';
import NumberPadButtons from '../Wallets/NumberPadButtons';
import { EBalanceUnit, EBitcoinUnit } from '../../store/types/wallet';
import {
	balanceUnitSelector,
	selectedCurrencySelector,
} from '../../store/reselect/settings';

const NumberPadLightning = ({
	sats,
	onChange,
	onDone,
	onMaxPress,
	style,
}: {
	sats: number;
	onChange: (amount: number) => void;
	onDone: () => void;
	onMaxPress: () => void;
	style?: object | Array<object>;
}): ReactElement => {
	const [decimalMode, setDecimalMode] = useState(false);
	const [prefixZeros, setPrefixZeros] = useState(0);

	const unit = useSelector(balanceUnitSelector);
	const currency = useSelector(selectedCurrencySelector);
	const exchangeRate = useExchangeRate(currency);
	const displayValue = useDisplayValues(sats);

	const onPress = (key: string): void => {
		let amount = '0';
		let newAmount = 0;

		if (key === 'delete') {
			onRemove();
			return;
		}

		if (key === '.') {
			setDecimalMode(true);
			return;
		} else {
			setDecimalMode(false);
		}

		if ((decimalMode || prefixZeros !== 0) && key === '0') {
			setPrefixZeros((prevValue) => prevValue + 1);
			return;
		} else {
			setPrefixZeros(0);
		}

		if (unit === EBalanceUnit.BTC) {
			amount = displayValue.bitcoinFormatted;
			amount = String(parseFloat(amount));

			const [, decimals] = amount.split('.');
			if (decimals?.length > 7) {
				return;
			}

			if (decimals?.length > 0 && key === '0') {
				setPrefixZeros((prevValue) => prevValue + 1);
				return;
			}

			if (prefixZeros !== 0) {
				if (decimals?.length > 0) {
					amount = `${amount}${'0'.repeat(prefixZeros)}${key}`;
				} else {
					amount = `${amount}.${'0'.repeat(prefixZeros)}${key}`;
				}
			} else {
				if (decimalMode) {
					amount = `${amount}.${key}`;
				} else {
					amount = `${amount}${key}`;
				}
			}

			newAmount = btcToSats(Number(amount));
		}

		if (unit === EBalanceUnit.satoshi) {
			amount = String(sats);
			newAmount = Number(`${amount}${key}`);
		}

		if (unit === EBalanceUnit.fiat) {
			amount = displayValue.fiatValue.toString();

			const [, decimals] = amount.split('.');
			if (decimals?.length > 1) {
				return;
			}

			if (decimals?.length > 0 && key === '0') {
				setPrefixZeros((prevValue) => prevValue + 1);
				return;
			}

			if (prefixZeros !== 0) {
				if (decimals?.length > 0) {
					amount = `${amount}${'0'.repeat(prefixZeros)}${key}`;
				} else {
					amount = `${amount}.${'0'.repeat(prefixZeros)}${key}`;
				}
			} else {
				if (decimalMode) {
					amount = `${amount}.${key}`;
				} else {
					amount = `${amount}${key}`;
				}
			}

			// Convert new fiat amount to satoshis.
			newAmount = fiatToBitcoinUnit({
				fiatValue: amount,
				bitcoinUnit: EBitcoinUnit.satoshi,
				currency,
				exchangeRate,
			});
		}
		// limit amount to 21 000 000 BTC
		if (newAmount > 2.1e15) {
			newAmount = 2.1e15;
		}

		onChange(newAmount);
	};

	const onRemove = (): void => {
		let amount = '0';
		let newAmount = '0';

		if (unit === EBalanceUnit.BTC) {
			amount = displayValue.bitcoinFormatted;
			amount = String(parseFloat(amount));

			// remove last character
			newAmount = amount.replace(/.$/, '');

			newAmount = String(btcToSats(Number(newAmount)));
		}

		if (unit === EBalanceUnit.satoshi) {
			amount = String(sats);
			newAmount = amount.substring(0, amount.length - 1);
		}
		if (unit === EBalanceUnit.fiat) {
			amount = displayValue.fiatValue.toString();

			// remove last character
			newAmount = amount.replace(/.$/, '');

			const fiatAmount = fiatToBitcoinUnit({
				fiatValue: newAmount,
				bitcoinUnit: EBitcoinUnit.satoshi,
				exchangeRate,
				currency,
			});

			newAmount = String(fiatAmount);
		}

		onChange(Number(newAmount));
	};

	const numberPadType = unit === EBalanceUnit.satoshi ? 'integer' : 'decimal';

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type={numberPadType}
			onPress={onPress}>
			<NumberPadButtons
				color="purple"
				onMaxPress={onMaxPress}
				onDone={onDone}
			/>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 425,
	},
});

export default memo(NumberPadLightning);
