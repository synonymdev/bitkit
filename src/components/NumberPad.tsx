import React, { memo, ReactElement } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { TouchableOpacity } from '../styles/components';
import { Text } from '../styles/text';
import { Ionicons } from '../styles/icons';
import { vibrate } from '../utils/helpers';

const ACTIVE_OPACITY = 0.2;
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const Button = memo(
	({
		num,
		onPress,
		testID,
	}: {
		num: number;
		onPress: () => void;
		testID?: string;
	}): ReactElement => {
		return (
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={ACTIVE_OPACITY}
				style={styles.buttonContainer}
				color="transparent"
				testID={testID}>
				<Text style={styles.button}>{num}</Text>
			</TouchableOpacity>
		);
	},
);

type NumberPad = {
	type: 'simple' | 'integer' | 'decimal';
	style?: StyleProp<ViewStyle>;
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
	const handleRemove = (): void => {
		vibrate();
		onRemove();
	};

	const handlePress = (key: number | string): void => {
		vibrate();
		onPress(key);
	};

	return (
		<View style={[styles.container, style]}>
			{children}
			<View style={styles.row}>
				<Button
					onPress={(): void => handlePress(digits[0])}
					num={digits[0]}
					testID="N1"
				/>
				<Button
					onPress={(): void => handlePress(digits[1])}
					num={digits[1]}
					testID="N2"
				/>
				<Button
					onPress={(): void => handlePress(digits[2])}
					num={digits[2]}
					testID="N3"
				/>
			</View>

			<View style={styles.row}>
				<Button
					onPress={(): void => handlePress(digits[3])}
					num={digits[3]}
					testID="N4"
				/>
				<Button
					onPress={(): void => handlePress(digits[4])}
					num={digits[4]}
					testID="N5"
				/>
				<Button
					onPress={(): void => handlePress(digits[5])}
					num={digits[5]}
					testID="N6"
				/>
			</View>

			<View style={styles.row}>
				<Button
					onPress={(): void => handlePress(digits[6])}
					num={digits[6]}
					testID="N7"
				/>
				<Button
					onPress={(): void => handlePress(digits[7])}
					num={digits[7]}
					testID="N8"
				/>
				<Button
					onPress={(): void => handlePress(digits[8])}
					num={digits[8]}
					testID="N9"
				/>
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
				<Button
					onPress={(): void => handlePress(digits[9])}
					num={digits[9]}
					testID="N0"
				/>
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
