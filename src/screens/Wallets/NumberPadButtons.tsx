import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { IColors } from '../../styles/colors';
import { TouchableHighlight } from '../../styles/components';
import { Caption13Up } from '../../styles/text';
import UnitButton from './UnitButton';

type NumberPadButtons = {
	color?: keyof IColors;
	onMax?: () => void;
	onChangeUnit?: () => void;
	onDone?: () => void;
};

const NumberPadButtons = ({
	color = 'brand',
	onMax,
	onChangeUnit,
	onDone,
}: NumberPadButtons): ReactElement => {
	const { t } = useTranslation('wallet');

	return (
		<View style={styles.container}>
			<View style={styles.buttonContainer}>
				{onMax && (
					<TouchableHighlight
						style={styles.button}
						color="white10"
						testID="NumberPadButtonsMax"
						onPressIn={onMax}>
						<Caption13Up color={color}>{t('send_max')}</Caption13Up>
					</TouchableHighlight>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{onChangeUnit && (
					<UnitButton
						color={color}
						testID="NumberPadButtonsUnit"
						onPress={onChangeUnit}
					/>
				)}
			</View>

			<View style={styles.buttonContainer}>
				{onDone && (
					<TouchableHighlight
						style={styles.button}
						color="white10"
						testID="NumberPadButtonsDone"
						onPressIn={onDone}>
						<Caption13Up color={color}>{t('send_done')}</Caption13Up>
					</TouchableHighlight>
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
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default memo(NumberPadButtons);
