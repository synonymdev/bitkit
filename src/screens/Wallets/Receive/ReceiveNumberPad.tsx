import React, { memo, ReactElement, useState } from 'react';

import NumberPad from '../../../components/NumberPad';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { convertToSats } from '../../../utils/conversion';
import { handleNumberPadPress } from '../../../utils/numberpad';
import {
	conversionUnitSelector,
	numberPadSelector,
} from '../../../store/reselect/settings';
import { updateInvoice } from '../../../store/slices/receive';
import { receiveSelector } from '../../../store/reselect/receive';
import { vibrate } from '../../../utils/helpers';

// max amount to avoid breaking UI
const MAX_AMOUNT = 999999999;

const ReceiveNumberPad = (): ReactElement => {
	const [errorKey, setErrorKey] = useState<string>();
	const dispatch = useAppDispatch();
	const invoice = useAppSelector(receiveSelector);
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const { maxLength, maxDecimals, type } = useAppSelector(numberPadSelector);

	const onPress = (key: string): void => {
		const numberPadText = handleNumberPadPress(key, invoice.numberPadText, {
			maxLength,
			maxDecimals,
		});

		const amount = convertToSats(numberPadText, conversionUnit);

		if (amount <= MAX_AMOUNT) {
			dispatch(updateInvoice({ amount, numberPadText }));
		} else {
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	return <NumberPad type={type} errorKey={errorKey} onPress={onPress} />;
};

export default memo(ReceiveNumberPad);
