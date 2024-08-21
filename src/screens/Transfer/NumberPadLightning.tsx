import React, { memo, ReactElement, useState } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import NumberPad from '../../components/NumberPad';
import NumberPadButtons from '../Wallets/NumberPadButtons';
import {
	conversionUnitSelector,
	numberPadSelector,
} from '../../store/reselect/settings';
import { useAppSelector } from '../../hooks/redux';
import { vibrate } from '../../utils/helpers';
import { showToast } from '../../utils/notifications';
import { convertToSats } from '../../utils/conversion';
import { handleNumberPadPress } from '../../utils/numberpad';

const NumberPadLightning = ({
	value,
	minAmount = 0,
	maxAmount,
	style,
	onChange,
	onMax,
	onChangeUnit,
	onDone,
}: {
	value: string;
	minAmount?: number;
	maxAmount: number;
	style?: StyleProp<ViewStyle>;
	onChange: (value: string) => void;
	onMax: () => void;
	onChangeUnit: () => void;
	onDone: () => void;
}): ReactElement => {
	const { t } = useTranslation('lightning');
	const [errorKey, setErrorKey] = useState<string>();
	const conversionUnit = useAppSelector(conversionUnitSelector);
	const { maxLength, maxDecimals, type } = useAppSelector(numberPadSelector);

	const onPress = (key: string): void => {
		const newValue = handleNumberPadPress(key, value, {
			maxLength,
			maxDecimals,
		});

		const amount = convertToSats(newValue, conversionUnit);

		if (amount <= maxAmount) {
			onChange(newValue);
		} else {
			vibrate({ type: 'notificationWarning' });
			setErrorKey(key);
			setTimeout(() => setErrorKey(undefined), 500);
		}
	};

	const onDonePress = (): void => {
		const amount = convertToSats(value, conversionUnit);

		if (amount < minAmount && amount !== 0) {
			vibrate({ type: 'notificationWarning' });
			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description: t('transfer.error_min_amount', { amount: minAmount }),
			});
			return;
		}

		if (amount > maxAmount) {
			vibrate({ type: 'notificationWarning' });
			showToast({
				type: 'warning',
				title: t('error_channel_purchase'),
				description: t('transfer.error_max_amount', { amount: maxAmount }),
			});
			return;
		}

		onDone();
	};

	return (
		<NumberPad
			style={[styles.numberpad, style]}
			type={type}
			errorKey={errorKey}
			onPress={onPress}>
			<NumberPadButtons
				color="white"
				onMax={onMax}
				onChangeUnit={onChangeUnit}
				onDone={onDonePress}
			/>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 380,
		position: 'relative',
	},
});

export default memo(NumberPadLightning);
