import React, { memo, ReactElement, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { TouchableOpacity } from '../../styles/components';
import { Text02B } from '../../styles/text';
import { SwitchIcon } from '../../styles/icons';
import { updateSettings } from '../../store/actions/settings';
import useDisplayValues from '../../hooks/displayValues';
import { IColors } from '../../styles/colors';
import { transactionMaxSelector } from '../../store/reselect/wallet';
import { balanceUnitSelector } from '../../store/reselect/settings';
import { EBalanceUnit, EBitcoinUnit } from '../../store/types/wallet';
import { useBalance } from '../../hooks/wallet';

type NumberPadButtons = {
	color?: keyof IColors;
	showUnitButton?: boolean;
	onMaxPress?: () => void;
	onDone?: () => void;
};

const NumberPadButtons = ({
	color = 'brand',
	showUnitButton = true,
	onMaxPress,
	onDone,
}: NumberPadButtons): ReactElement => {
	const { t } = useTranslation('wallet');
	const { satoshis } = useBalance({ onchain: true, lightning: true });
	const unit = useSelector(balanceUnitSelector);
	const isMaxSendAmount = useSelector(transactionMaxSelector);
	const displayValues = useDisplayValues(satoshis);

	// BTC -> satoshi -> fiat
	const nextUnit = useMemo(() => {
		if (unit === EBalanceUnit.BTC) {
			return EBalanceUnit.satoshi;
		}
		if (unit === EBalanceUnit.satoshi) {
			return EBalanceUnit.fiat;
		}
		return EBalanceUnit.BTC;
	}, [unit]);

	const onChangeUnit = (): void => {
		updateSettings({
			balanceUnit: nextUnit,
			...(nextUnit !== EBalanceUnit.fiat && {
				bitcoinUnit: nextUnit as unknown as EBitcoinUnit,
			}),
		});
	};

	return (
		<View style={styles.container}>
			<View style={styles.buttonContainer}>
				{onMaxPress && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						disabled={satoshis <= 0}
						onPress={onMaxPress}>
						<Text02B size="12px" color={isMaxSendAmount ? 'orange' : color}>
							{t('send_max')}
						</Text02B>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{showUnitButton && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						onPress={onChangeUnit}>
						<SwitchIcon color={color} width={16.44} height={13.22} />
						<Text02B size="12px" color={color} style={styles.middleButtonText}>
							{nextUnit === 'BTC' && 'BTC'}
							{nextUnit === 'satoshi' && 'sats'}
							{nextUnit === 'fiat' && displayValues.fiatTicker}
						</Text02B>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{onDone && (
					<TouchableOpacity
						style={styles.button}
						color="white08"
						onPress={onDone}>
						<Text02B size="12px" color={color}>
							{t('send_done')}
						</Text02B>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingVertical: 10,
		paddingTop: 15,
		justifyContent: 'space-evenly',
	},
	buttonContainer: {
		flex: 1,
		alignItems: 'center',
		minHeight: 28,
	},
	button: {
		paddingVertical: 7,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
	middleButtonText: {
		marginLeft: 11,
	},
});

export default memo(NumberPadButtons);
