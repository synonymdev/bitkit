import React, { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text02B, TouchableOpacity } from '../../styles/components';
import NumberPad from '../../components/NumberPad';

const NumberPadWeeks = ({ weeks, onChange, onDone }): ReactElement => {
	const onPress = (key): void => {
		let amount = Number(`${weeks}${key}`);
		// limit amount 12 weeks
		if (amount > 12) {
			amount = 12;
		}
		onChange(amount);
	};

	const onRemove = (): void => {
		let str = String(weeks);
		str = str.substr(0, str.length - 1);
		const amount = Number(str);
		onChange(amount);
	};

	const onClear = (): void => {
		onChange(0);
	};

	const handleDone = (): void => {
		if (weeks < 1) {
			onChange(1);
		}
		onDone();
	};

	return (
		<NumberPad
			style={styles.numberpad}
			onPress={onPress}
			onRemove={onRemove}
			onClear={onClear}>
			<View style={styles.topRow}>
				<TouchableOpacity
					style={styles.topRowButtons}
					color="onSurface"
					onPress={(): void => {
						onChange(12);
					}}>
					<Text02B size="12px" color="purple">
						MAX
					</Text02B>
				</TouchableOpacity>
				<TouchableOpacity
					style={styles.topRowButtons}
					color="onSurface"
					onPress={handleDone}>
					<Text02B size="12px" color="purple">
						DONE
					</Text02B>
				</TouchableOpacity>
			</View>
		</NumberPad>
	);
};

const styles = StyleSheet.create({
	numberpad: {
		maxHeight: 350,
	},
	topRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 5,
		paddingHorizontal: 5,
		// TODO: replace shadow with proper gradient
		shadowColor: 'rgba(185, 92, 232, 0.36)',
		shadowOpacity: 0.8,
		elevation: 6,
		shadowRadius: 15,
		shadowOffset: { width: 1, height: 13 },
	},
	topRowButtons: {
		paddingVertical: 5,
		paddingHorizontal: 8,
		borderRadius: 8,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default NumberPadWeeks;
