import React, { memo, ReactElement } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { TouchableOpacity } from '../styles/components';
import { Text } from '../styles/text';
import { BackspaceIcon } from '../styles/icons';
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
		<TouchableOpacity
			style={styles.buttonContainer}
			color="transparent"
			activeOpacity={ACTIVE_OPACITY}
			testID={testID}
			onPress={onPress}>
			<Text style={[styles.button, hasError && styles.buttonError]}>
				{text}
			</Text>
		</TouchableOpacity>
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
				<TouchableOpacity
					style={styles.buttonContainer}
					color="transparent"
					activeOpacity={ACTIVE_OPACITY}
					testID="NRemove"
					onPress={(): void => handlePress('delete')}>
					<BackspaceIcon />
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
		color: '#ff6600',
	},
});

export default memo(NumberPad);
