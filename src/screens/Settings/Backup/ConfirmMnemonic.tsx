import React, { memo, ReactElement, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
	View as ThemedView,
	Text01S,
	Text01M,
} from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import { shuffleArray } from '../../../utils/helpers';

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

const ConfirmMnemonic = ({ navigation, route }): ReactElement => {
	const origSeed = route.params.seed;
	const [seed, setSeed] = useState(Array(origSeed.length).fill(undefined));
	const [pressed, setPressed] = useState(Array(origSeed.length).fill(false));
	const shuffled = useMemo(() => shuffleArray(origSeed), [origSeed]);

	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 10,
		}),
		[insets.bottom],
	);

	const handleWordPress = (word, index): void => {
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

	const disabled = seed.some((v, i) => origSeed[i] !== v);

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<NavigationHeader title="Confirm Recovery Phrase" size="sm" />

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
				<Button
					size="lg"
					text="Next"
					disabled={disabled}
					onPress={(): void => navigation.navigate('Result')}
				/>
			</View>
		</ThemedView>
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
		marginTop: 32,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'flex-start',
	},
	button: {
		marginHorizontal: 4,
		marginBottom: 5,
		minWidth: 50,
	},
	seedContainer: {
		marginVertical: 32,
		paddingHorizontal: 16,
		flexDirection: 'row',
	},
	col: {
		marginHorizontal: 16,
		flex: 1,
	},
	nextButtonContainer: {
		width: '100%',
		minHeight: 100,
		flex: 1,
		justifyContent: 'flex-end',
		paddingHorizontal: 32,
	},
	word: {
		marginBottom: 8,
	},
});

export default memo(ConfirmMnemonic);
