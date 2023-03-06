import React, { ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as bip39 from 'bip39';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';

import Button, { IButton } from './Button';
import { Text13UP } from '../styles/text';
import seedSuggestions from '../utils/seed-suggestions';

const Word = (props: IButton): ReactElement => {
	return <Button style={styles.wordContainer} {...props} />;
};

/**
 * Show keyboad accessory with seed suggestions
 */
const SeedInputAccessory = ({
	label,
	word,
	setWord,
}: {
	label: string;
	word: string;
	setWord: (word: string) => void;
}): ReactElement => {
	const [suggestions, setSuggestions] = useState<string[]>([]);

	useEffect(() => {
		if (word !== null) {
			const s = seedSuggestions(word ?? '', bip39.wordlists.english);
			setSuggestions(s);
		}
	}, [word]);

	const content = (
		<View style={styles.suggestions}>
			<Text13UP color="gray1">{label}</Text13UP>
			<View style={styles.suggestionsRow}>
				{suggestions.map((s) => (
					<Word text={s} key={s} onPress={(): void => setWord(s)} />
				))}
			</View>
		</View>
	);

	return (
		<KeyboardAccessoryView hideBorder androidAdjustResize avoidKeyboard>
			{content}
		</KeyboardAccessoryView>
	);
};

const styles = StyleSheet.create({
	suggestions: {
		backgroundColor: 'black',
		paddingHorizontal: 48,
		paddingTop: 16,
		paddingBottom: 10,
	},
	suggestionsRow: {
		flexDirection: 'row',
		marginTop: 10,
		minHeight: 50,
	},
	wordContainer: {
		marginRight: 8,
	},
});

export default SeedInputAccessory;
