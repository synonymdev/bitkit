import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text01S, Text01M } from '../../../styles/text';
import Button from '../../../components/Button';
import { shuffleArray } from '../../../utils/helpers';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import type { BackupScreenProps } from '../../../navigation/types';

const Word = ({
	number,
	word,
	correct,
}: {
	number: number;
	word: string;
	correct: boolean;
}): ReactElement => {
	return (
		<Text01M style={styles.word}>
			<Text01M color="white5">{number}. </Text01M>
			<Text01M color={correct ? 'green' : 'red'}> {word}</Text01M>
		</Text01M>
	);
};

const ConfirmMnemonic = ({
	navigation,
	route,
}: BackupScreenProps<'ConfirmMnemonic'>): ReactElement => {
	const { seed: origSeed, bip39Passphrase } = route.params;
	const [seed, setSeed] = useState(Array(origSeed.length).fill(undefined));
	const [pressed, setPressed] = useState(Array(origSeed.length).fill(false));
	const shuffled = useMemo(() => shuffleArray(origSeed), [origSeed]);

	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleWordPress = (word: string, index: number): void => {
		// find index of the last filled word
		const lastIndex = seed.findIndex(
			(v, i, arr) => v !== undefined && arr[i + 1] === undefined,
		);

		// if the word is correct and pressed do nothing
		if (pressed[index] && origSeed[lastIndex] === seed[lastIndex]) {
			return;
		}

		// if previous word is incorrect
		if (lastIndex !== -1 && seed[lastIndex] !== origSeed[lastIndex]) {
			// uncheck if we tap on it
			if (pressed[index] && word === seed[lastIndex]) {
				setPressed((items) => {
					items[index] = false;
					return [...items];
				});
				setSeed((items) => {
					items[lastIndex] = undefined;
					return [...items];
				});
			}
			return;
		}

		// mark word as pressed and add it to the seed
		setPressed((items) => {
			items[index] = true;
			return [...items];
		});
		setSeed((items) => {
			items[lastIndex + 1] = word;
			return [...items];
		});
	};

	const showButton = seed.some((v, i) => origSeed[i] !== v);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Confirm Recovery Phrase" />

			<Text01S color="gray1" style={styles.text}>
				Tap the 12 words in the correct order.
			</Text01S>

			<View style={styles.buttons}>
				{shuffled.map((w, i) => {
					return (
						<Button
							key={i}
							text={w}
							style={styles.button}
							color={pressed[i] ? 'white32' : 'white08'}
							onPress={(): void => handleWordPress(w, i)}
							testID={`Word-${w}`}
						/>
					);
				})}
			</View>

			<View style={styles.seedContainer}>
				<View style={styles.col}>
					{seed.slice(0, seed.length / 2).map((w, i) => (
						<Word key={i} word={w} number={i + 1} correct={w === origSeed[i]} />
					))}
				</View>
				<View style={styles.col}>
					{seed.slice(-seed.length / 2).map((w, i) => (
						<Word
							key={i}
							word={w}
							number={i + seed.length / 2 + 1}
							correct={w === origSeed[i + seed.length / 2]}
						/>
					))}
				</View>
			</View>

			<View style={nextButtonContainer}>
				{!showButton && (
					<Button
						size="large"
						text="Continue"
						onPress={(): void => {
							if (bip39Passphrase) {
								navigation.navigate('ConfirmPassphrase', { bip39Passphrase });
							} else {
								navigation.navigate('Result');
							}
						}}
						testID="Continue"
					/>
				)}
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		paddingHorizontal: 32,
	},
	buttons: {
		marginTop: 16,
		paddingLeft: 32,
		paddingRight: 28,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	button: {
		marginRight: 4,
		marginTop: 5,
		minWidth: 50,
	},
	seedContainer: {
		marginVertical: 22,
		paddingHorizontal: 16,
		flexDirection: 'row',
	},
	col: {
		marginHorizontal: 16,
		flex: 1,
	},
	nextButtonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
		width: '100%',
	},
	word: {
		marginBottom: 8,
	},
});

export default memo(ConfirmMnemonic);
