import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useState,
} from 'react';
import {
	StyleProp,
	StyleSheet,
	useWindowDimensions,
	View,
	ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '../../styles/text';
import {
	AddIcon,
	DivideIcon,
	EqualsIcon,
	MultiplyIcon,
	NegateIcon,
	PercentageIcon,
	SubtractIcon,
} from '../../styles/icons';
import { IThemeColors } from '../../styles/themes';
import { Pressable, View as ThemedView } from '../../styles/components';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import { vibrate } from '../../utils/helpers';
import { getKeychainValue, setKeychainValue } from '../../utils/keychain';
import { showToast } from '../../utils/notifications';
import { wipeApp } from '../../store/utils/settings';
import { PIN_ATTEMPTS } from '../../constants/app';

type Key = {
	value: string;
	content: ReactElement | string;
	color: keyof IThemeColors;
};

const matrix: Key[][] = [
	[
		{ value: 'AC', content: 'AC', color: 'white64' },
		{ value: '+-', content: <NegateIcon />, color: 'white64' },
		{ value: '%', content: <PercentageIcon />, color: 'white64' },
		{ value: '/', content: <DivideIcon />, color: 'brand' },
	],
	[
		{ value: '7', content: '7', color: 'white' },
		{ value: '8', content: '8', color: 'white' },
		{ value: '9', content: '9', color: 'white' },
		{ value: 'x', content: <MultiplyIcon />, color: 'brand' },
	],
	[
		{ value: '4', content: '4', color: 'white' },
		{ value: '5', content: '5', color: 'white' },
		{ value: '6', content: '6', color: 'white' },
		{ value: '-', content: <SubtractIcon />, color: 'brand' },
	],
	[
		{ value: '1', content: '1', color: 'white' },
		{ value: '2', content: '2', color: 'white' },
		{ value: '3', content: '3', color: 'white' },
		{ value: '+', content: <AddIcon />, color: 'brand' },
	],
	[
		{ value: '0', content: '0', color: 'white' },
		{ value: '.', content: '.', color: 'white' },
		{ value: '=', content: <EqualsIcon />, color: 'brand' },
	],
];

const Symbol = ({
	symbol,
	color,
}: {
	symbol: string | ReactElement;
	color?: keyof IThemeColors;
}): ReactElement => {
	const isAc = symbol === 'AC';
	const textStyle = {
		...(isAc ? { fontSize: 36, lineHeight: 36 } : {}),
	};

	if (typeof symbol === 'string') {
		return (
			<Text style={[styles.buttonText, textStyle]} color={color}>
				{symbol}
			</Text>
		);
	}

	return React.cloneElement(symbol, { color, height: 42 });
};

const Button = ({
	symbol,
	color = 'white',
	style,
	onPress,
}: {
	symbol: string | ReactElement;
	color?: keyof IThemeColors;
	style?: StyleProp<ViewStyle>;
	onPress: () => void;
}): ReactElement => {
	const symbolColor = color === 'brand' ? 'white' : 'black';

	return (
		<Pressable
			style={({ pressed }): StyleProp<ViewStyle> => [
				styles.button,
				style,
				pressed && styles.pressed,
			]}
			color={color}
			testID={`calculator-button-${symbol}`}
			onPressIn={onPress}>
			<Symbol symbol={symbol} color={symbolColor} />
		</Pressable>
	);
};

const Calculator = ({ onSuccess }: { onSuccess: () => void }): ReactElement => {
	const { t } = useTranslation('security');
	const { width } = useWindowDimensions();
	const [input, setInput] = useState('');
	const [attemptsRemaining, setAttemptsRemaining] = useState(0);

	// on mount
	useEffect(() => {
		(async (): Promise<void> => {
			// wait for initial keychain read
			const response = await getKeychainValue({
				key: 'pinAttemptsRemaining',
			});

			if (!response.error) {
				let attempts = 5;
				if (response.data !== undefined) {
					attempts = Number(response.data);
				}
				setAttemptsRemaining(attempts);
			}
		})();
	}, []);

	const onPress = (key: string): void => {
		vibrate();

		if (key === 'AC') {
			setInput('');
			return;
		}

		if (key === '+-') {
			setInput((prev) => {
				if (prev === '0') {
					return prev;
				}

				if (prev.startsWith('-')) {
					return prev.slice(1);
				}

				return `-${prev}`;
			});
			return;
		}

		if (key === '%') {
			if (!input.endsWith('%')) {
				setInput((prev) => prev + key);
			}
			return;
		}

		if (key === '/') {
			if (!input.endsWith('/')) {
				setInput((prev) => prev + key);
			}
			return;
		}

		if (key === 'x') {
			setInput((prev) => prev + '*');
			return;
		}

		if (key === '-') {
			if (!input.endsWith('-')) {
				setInput((prev) => prev + key);
			}
			return;
		}

		if (key === '+') {
			if (!input.endsWith('+')) {
				setInput((prev) => prev + key);
			}
			return;
		}

		if (key === '.') {
			if (!input.endsWith('.')) {
				setInput((prev) => prev + key);
			}
			return;
		}

		if (key === '=') {
			onCalculate();
			return;
		}

		setInput((prev) => {
			return prev + key;
		});
	};

	const onCalculate = async (): Promise<void> => {
		// check if input ends with a number
		if (!/[0-9]$/.test(input)) {
			return;
		}

		// Check only for 4 digit numbers
		if (input.length === 4 && /^[0-9]+$/.test(input)) {
			checkPin();
			return;
		}

		try {
			// `Function` constructor is safer than eval()
			// make sure input doesn't contain anything other than numbers and operators
			if (/^[0-9+\-*/().\s]+$/.test(input)) {
				// eslint-disable-next-line no-new-func
				const result = Function(`"use strict"; return (${input})`)();
				setInput(result.toString());
			}
		} catch (e) {
			setInput('ERROR');
			setTimeout(() => setInput(''), 2000);
		}
	};

	// Reduce the amount of pin attempts remaining
	const reduceAttemptsRemaining = useCallback(async (): Promise<void> => {
		const attempts = attemptsRemaining - 1;
		await setKeychainValue({
			key: 'pinAttemptsRemaining',
			value: `${attempts}`,
		});
		setAttemptsRemaining(attempts);
	}, [attemptsRemaining]);

	const checkPin = async (): Promise<void> => {
		const realPIN = await getKeychainValue({ key: 'pin' });

		// Error getting PIN
		if (realPIN.error) {
			await reduceAttemptsRemaining();
			vibrate();
			return;
		}

		// Incorrect PIN
		if (input !== realPIN.data) {
			if (attemptsRemaining <= 1) {
				vibrate({ type: 'default' });
				await wipeApp();
				showToast({
					type: 'warning',
					title: t('wiped_title'),
					description: t('wiped_message'),
				});
			} else {
				await reduceAttemptsRemaining();
			}

			vibrate();
			return;
		}

		// Correct PIN, reset pin attempts
		await setKeychainValue({
			key: 'pinAttemptsRemaining',
			value: PIN_ATTEMPTS,
		});
		onSuccess();
	};

	// No CSS grid, so we need to calculate the button width
	const rowWidth = width - 16 * 2;
	const gapWidth = 8;
	const buttonWidth = (rowWidth - gapWidth * 3) / 4;
	const zeroButtonWidth = buttonWidth * 2 + gapWidth;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('calculator.nav_title')}
				displayBackButton={false}
			/>
			<View style={styles.content}>
				<ThemedView style={styles.input} color="white16">
					{!input ? (
						<Text style={styles.inputText} color="secondary">
							0
						</Text>
					) : (
						<Text style={styles.inputText} color="white">
							{input}
						</Text>
					)}
				</ThemedView>

				{matrix.map((row, rowIndex) => (
					<View style={styles.row} key={`row-${rowIndex}`}>
						{row.map((key, columnIndex) => {
							const isFirst = columnIndex === 0;
							const isZero = key.value === '0';

							const style = {
								width: buttonWidth,
								...(isFirst ? { marginLeft: 0 } : {}),
								...(isZero ? { width: zeroButtonWidth } : {}),
							};

							return (
								<Button
									key={`button-${rowIndex}-${columnIndex}`}
									style={style}
									symbol={key.content}
									color={key.color}
									onPress={(): void => onPress(key.value)}
								/>
							);
						})}
					</View>
				))}
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		...StyleSheet.absoluteFillObject,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
		marginTop: 'auto',
	},
	input: {
		borderRadius: 8,
		height: 120,
		paddingHorizontal: 32,
		marginTop: 'auto',
		alignItems: 'flex-end',
		justifyContent: 'center',
	},
	inputText: {
		fontSize: 64,
		lineHeight: 64,
		fontWeight: '900',
		paddingTop: 8,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		height: 80,
		marginTop: 8,
	},
	buttonText: {
		fontSize: 48,
		lineHeight: 48,
		fontWeight: '900',
		paddingTop: 8,
	},
	pressed: {
		opacity: 0.9,
	},
});

export default memo(Calculator);
