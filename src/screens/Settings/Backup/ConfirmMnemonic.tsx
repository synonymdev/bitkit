import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import type { BackupScreenProps } from '../../../navigation/types';
import { BodyM, BodyMSB } from '../../../styles/text';
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
		<BodyMSB style={styles.word}>
			<BodyMSB color="secondary">{number}. </BodyMSB>
			<BodyMSB color={correct ? 'green' : 'red'}> {word}</BodyMSB>
		</BodyMSB>
	);
};

const ConfirmMnemonic = ({
	navigation,
	route,
}: BackupScreenProps<'ConfirmMnemonic'>): ReactElement => {
	const { t } = useTranslation('security');
	const { seed: origSeed, bip39Passphrase } = route.params;
	const [seed, setSeed] = useState(Array(origSeed.length).fill(undefined));
	const [pressed, setPressed] = useState(Array(origSeed.length).fill(false));
	const shuffled = useMemo(() => shuffleArray(origSeed), [origSeed]);

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

	const isDisabled = seed.some((v, i) => origSeed[i] !== v);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('mnemonic_confirm')} />

			<BodyM color="secondary" style={styles.text}>
				{t('mnemonic_confirm_tap')}
			</BodyM>

			<View style={styles.buttons}>
				{shuffled.map((w, i) => {
					return (
						<Button
							key={i}
							text={w}
							style={styles.button}
							color={pressed[i] ? 'white32' : 'white16'}
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

			<View style={styles.buttonContainer}>
				<Button
					size="large"
					text={t('continue')}
					disabled={isDisabled}
					testID="ContinueConfirmMnemonic"
					onPress={(): void => {
						if (bip39Passphrase) {
							navigation.navigate('ConfirmPassphrase', { bip39Passphrase });
						} else {
							navigation.navigate('Warning');
						}
					}}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
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
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
	},
	word: {
		marginBottom: 8,
	},
});

export default memo(ConfirmMnemonic);
