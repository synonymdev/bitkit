import { EUnit } from '../../store/types/wallet';
import { getDisplayValues } from '../displayValues';

/**
 * Handles the logic for NumberPads that deal with currency amounts
 */
export const handleNumberPadPress = (
	key: string,
	current: string,
	options?: { maxLength?: number; maxDecimals?: number },
): string => {
	const maxLength = options?.maxLength ?? 20;
	const maxDecimals = options?.maxDecimals ?? 2;

	const [integer, decimals] = current.split('.');

	if (key === 'delete') {
		if (current.endsWith('0.')) {
			return '';
		}

		if (decimals?.length >= maxDecimals) {
			return `${integer}.${decimals.substring(0, maxDecimals - 1)}`;
		}

		return current.slice(0, -1);
	}

	if (current === '0') {
		// no leading zeros
		if (key !== '.' && key !== 'delete') {
			return key;
		}
	}

	// limit to maxLength
	if (current.length === maxLength) {
		return current;
	}

	// limit to maxDecimals
	if (decimals?.length >= maxDecimals) {
		return current;
	}

	if (key === '.') {
		// no multiple decimal symbol
		if (current.includes('.')) {
			return current;
		}

		// add leading zero
		if (current === '') {
			return `0${key}`;
		}
	}

	return `${current}${key}`;
};

/**
 * Converts an amount (in satoshis) to a string usable in NumberPadTextField
 */
export const getNumberPadText = (
	amount: number,
	unit?: EUnit,
	shouldRound?: boolean,
): string => {
	if (amount === 0) {
		return '';
	}

	if (unit === EUnit.BTC) {
		const displayValue = getDisplayValues({
			satoshis: amount,
			unit: EUnit.BTC,
		});

		const { bitcoinWhole, bitcoinDecimal } = displayValue;
		const decimalPart = Number(bitcoinDecimal) ? `.${bitcoinDecimal}` : '';

		return `${bitcoinWhole}${decimalPart}`;
	}

	if (unit === EUnit.fiat) {
		const displayValue = getDisplayValues({
			satoshis: amount,
			unit: EUnit.satoshi,
		});

		if (shouldRound) {
			return displayValue.fiatValue.toFixed(0);
		} else {
			return displayValue.fiatValue.toString();
		}
	}

	const displayValue = getDisplayValues({
		satoshis: amount,
		unit: EUnit.satoshi,
	});

	return displayValue.satoshis.toString();
};
