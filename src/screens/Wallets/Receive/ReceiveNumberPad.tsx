import React, { memo, ReactElement, useState } from 'react';
import { useSelector } from 'react-redux';

import NumberPad from '../../../components/NumberPad';
import { convertToSats } from '../../../utils/exchange-rate';
import { handleNumberPadPress } from '../../../utils/numberpad';
import { EBalanceUnit } from '../../../store/types/wallet';
import { balanceUnitSelector } from '../../../store/reselect/settings';
import { updateInvoice } from '../../../store/actions/receive';
import { receiveSelector } from '../../../store/reselect/receive';
import { vibrate } from '../../../utils/helpers';

// max amount to avoid breaking UI
const MAX_AMOUNT = 999999999;

const ReceiveNumberPad = (): ReactElement => {
	const [errorKey, setErrorKey] = useState<string>();
	const invoice = useSelector(receiveSelector);
	const unit = useSelector(balanceUnitSelector);

	const maxDecimals = unit === EBalanceUnit.BTC ? 8 : 2;
	const maxLength = 10;
	const numberPadType = unit === EBalanceUnit.satoshi ? 'integer' : 'decimal';

	const onPress = (key: string): void => {
		const numberPadText = handleNumberPadPress(key, invoice.numberPadText, {
			maxLength,
			maxDecimals,
		});

		const amount = convertToSats(numberPadText, unit);

		if (amount <= MAX_AMOUNT) {
			updateInvoice({ amount, numberPadText });
		} else {
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	return (
		<NumberPad type={numberPadType} errorKey={errorKey} onPress={onPress} />
	);
};

export default memo(ReceiveNumberPad);
