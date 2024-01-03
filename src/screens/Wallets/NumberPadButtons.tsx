import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppSelector } from '../../hooks/redux';
import { useTranslation } from 'react-i18next';

import { TouchableOpacity } from '../../styles/components';
import { Caption13Up } from '../../styles/text';
import { SwitchIcon } from '../../styles/icons';
import { useCurrency } from '../../hooks/displayValues';
import { IColors } from '../../styles/colors';
import { primaryUnitSelector } from '../../store/reselect/settings';
import { EUnit } from '../../store/types/wallet';

type NumberPadButtons = {
	color?: keyof IColors;
	showUnitButton?: boolean;
	isMaxAmount?: boolean;
	onMax?: () => void;
	onChangeUnit?: () => void;
	onDone?: () => void;
};

const NumberPadButtons = ({
	color = 'brand',
	showUnitButton = true,
	isMaxAmount = false,
	onMax,
	onChangeUnit,
	onDone,
}: NumberPadButtons): ReactElement => {
	const { t } = useTranslation('wallet');
	const { fiatTicker } = useCurrency();
	const unit = useAppSelector(primaryUnitSelector);

	return (
		<View style={styles.container}>
			<View style={styles.buttonContainer}>
				{onMax && (
					<TouchableOpacity
						style={styles.button}
						color="white10"
						testID="NumberPadButtonsMax"
						onPress={onMax}>
						<Caption13Up color={isMaxAmount ? 'orange' : color}>
							{t('send_max')}
						</Caption13Up>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{showUnitButton && (
					<TouchableOpacity
						style={styles.button}
						color="white10"
						testID="NumberPadButtonsUnit"
						onPress={onChangeUnit}>
						<SwitchIcon color={color} width={16.44} height={13.22} />
						<Caption13Up color={color} style={styles.middleButtonText}>
							{unit === EUnit.BTC && 'BTC'}
							{unit === EUnit.satoshi && 'sats'}
							{unit === EUnit.fiat && fiatTicker}
						</Caption13Up>
					</TouchableOpacity>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{onDone && (
					<TouchableOpacity
						style={styles.button}
						color="white10"
						testID="NumberPadButtonsDone"
						onPress={onDone}>
						<Caption13Up color={color}>{t('send_done')}</Caption13Up>
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
