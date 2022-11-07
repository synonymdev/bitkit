import React, { memo, ReactElement, useMemo } from 'react';
import { View, StyleSheet, GestureResponderEvent } from 'react-native';
import { Text, TouchableOpacity, Ionicons } from '../styles/components';
import { vibrate } from '../utils/helpers';

const ACTIVE_OPACITY = 0.2;
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const Button = memo(
	({
		num,
		onPress,
	}: {
		num: number;
		onPress: (event: GestureResponderEvent) => void;
	}): ReactElement => {
		return (
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={ACTIVE_OPACITY}
				style={styles.buttonContainer}
				color="transparent">
				<Text style={styles.button}>{num}</Text>
			</TouchableOpacity>
		);
	},
);

type NumberPad = {
	type: 'simple' | 'integer' | 'decimal';
	style?: object | Array<object>;
	children?: ReactElement;
	onPress: (key: number | string) => void;
	onRemove: () => void;
};

const NumberPad = ({
	onPress,
	onRemove,
	type,
	style,
	children,
}: NumberPad): ReactElement => {
	const container = useMemo(
		() => StyleSheet.compose(styles.container, style),
		[style],
	);

	const handleRemove = (): void => {
		vibrate({});
		onRemove();
	};

	const handlePress = (key: number | string): void => {
		vibrate({});
		onPress(key);
	};

	return (
		<View style={container}>
			{children}
			<View style={styles.row}>
				<Button onPress={(): void => handlePress(digits[0])} num={digits[0]} />
				<Button onPress={(): void => handlePress(digits[1])} num={digits[1]} />
				<Button onPress={(): void => handlePress(digits[2])} num={digits[2]} />
			</View>

			<View style={styles.row}>
				<Button onPress={(): void => handlePress(digits[3])} num={digits[3]} />
				<Button onPress={(): void => handlePress(digits[4])} num={digits[4]} />
				<Button onPress={(): void => handlePress(digits[5])} num={digits[5]} />
			</View>

			<View style={styles.row}>
				<Button onPress={(): void => handlePress(digits[6])} num={digits[6]} />
				<Button onPress={(): void => handlePress(digits[7])} num={digits[7]} />
				<Button onPress={(): void => handlePress(digits[8])} num={digits[8]} />
			</View>

			<View style={styles.row}>
				{type === 'simple' && <View style={styles.buttonContainer} />}
				{type === 'integer' && (
					<TouchableOpacity
						onPress={(): void => handlePress('000')}
						activeOpacity={ACTIVE_OPACITY}
						style={styles.buttonContainer}
						color="transparent">
						<Text style={styles.button}>000</Text>
					</TouchableOpacity>
				)}
				{type === 'decimal' && (
					<TouchableOpacity
						onPress={(): void => handlePress('.')}
						activeOpacity={ACTIVE_OPACITY}
						style={styles.buttonContainer}
						color="transparent">
						<Text style={styles.button}>.</Text>
					</TouchableOpacity>
				)}
				<Button onPress={(): void => handlePress(digits[9])} num={digits[9]} />
				<TouchableOpacity
					onPress={handleRemove}
					activeOpacity={ACTIVE_OPACITY}
					style={styles.buttonContainer}
					color="transparent">
					<Ionicons name={'ios-backspace-outline'} size={31} />
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingBottom: 16,
	},
	buttonContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	button: {
		fontSize: 24,
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-evenly',
	},
});

export default memo(NumberPad);
