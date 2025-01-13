import React, { memo, ReactElement } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Pressable } from '../styles/components';
import { BackspaceIcon } from '../styles/icons';
import { Text } from '../styles/text';
import { vibrate } from '../utils/helpers';

const ACTIVE_OPACITY = 0.2;
const matrix = [
	['1', '2', '3'],
	['4', '5', '6'],
	['7', '8', '9'],
];

const Button = memo(
	({
		text,
		hasError,
		onPress,
		testID,
	}: {
		text: string;
		onPress: () => void;
		hasError?: boolean;
		testID?: string;
	}): ReactElement => (
		<Pressable
			style={({ pressed }): StyleProp<ViewStyle> => [
				styles.buttonContainer,
				pressed && styles.pressed,
			]}
			color="transparent"
			testID={testID}
			onPressIn={onPress}>
			<Text style={[styles.button, hasError && styles.buttonError]}>
				{text}
			</Text>
		</Pressable>
	),
);

type NumberPad = {
	type: 'simple' | 'integer' | 'decimal';
	onPress: (key: string) => void;
	errorKey?: string;
	style?: StyleProp<ViewStyle>;
	children?: ReactElement;
};

const NumberPad = ({
	type,
	errorKey,
	style,
	children,
	onPress,
}: NumberPad): ReactElement => {
	const handlePress = (key: string): void => {
		vibrate();
		onPress(key);
	};

	return (
		<View style={[styles.container, style]}>
			{children}

			{matrix.map((row, rowIndex) => (
				<View style={styles.row} key={`row-${rowIndex}`}>
					{row.map((number, columnIndex) => (
						<Button
							key={`button-${rowIndex}-${columnIndex}`}
							text={number}
							hasError={errorKey === number}
							testID={`N${number}`}
							onPress={(): void => handlePress(number)}
						/>
					))}
				</View>
			))}

			<View style={styles.row}>
				{type === 'simple' && <View style={styles.buttonContainer} />}
				{type === 'integer' && (
					<Button
						text="000"
						hasError={errorKey === '000'}
						testID="N000"
						onPress={(): void => handlePress('000')}
					/>
				)}
				{type === 'decimal' && (
					<Button
						text="."
						hasError={errorKey === '.'}
						testID="NDecimal"
						onPress={(): void => handlePress('.')}
					/>
				)}
				<Button
					text="0"
					hasError={errorKey === '0'}
					testID="N0"
					onPress={(): void => handlePress('0')}
				/>
				<Pressable
					style={({ pressed }): StyleProp<ViewStyle> => [
						styles.buttonContainer,
						pressed && styles.pressed,
					]}
					color="transparent"
					testID="NRemove"
					onPressIn={(): void => handlePress('delete')}>
					<BackspaceIcon />
				</Pressable>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-evenly',
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
	buttonError: {
		color: '#FF4400',
	},
	pressed: {
		opacity: ACTIVE_OPACITY,
	},
});

export default memo(NumberPad);
