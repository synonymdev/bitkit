import React, { ReactElement, useEffect, useState } from 'react';
import {
	TouchableOpacity,
	View,
	TextInput,
	Pressable,
} from '../../styles/components';
import { Text } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import { Keyboard, StyleSheet, FlatList } from 'react-native';
import {
	generateMnemonic,
	getMnemonicPhrase,
	validateMnemonic,
} from '../../utils/wallet';
import { getLastWordInString, setKeychainValue } from '../../utils/helpers';
import Button from '../../components/Button';
import { useSelector } from 'react-redux';
import { resetSelectedWallet } from '../../store/actions/wallet';
import SafeAreaView from '../../components/SafeAreaView';
import * as bip39 from 'bip39';
import { selectedWalletSelector } from '../../store/reselect/wallet';
import { selectedLanguageSelector } from '../../store/reselect/settings';

const ManageSeedPhrase = (): ReactElement => {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedLanguage = useSelector(selectedLanguageSelector);
	const [wordlist] = useState(bip39.wordlists[selectedLanguage]);
	const [mnemonic, setMnemonic] = useState('');
	const [currentMnemonic, setCurrentMnemonic] = useState('');
	const [loading, setLoading] = useState(false);
	const [suggestedWords, setSuggestedWords] = useState<string[]>([]);

	const setupComponent = async (): Promise<void> => {
		const response = await getMnemonicPhrase();
		if (!response.isErr()) {
			updateMnemonic(response.value);
			setCurrentMnemonic(response.value);
		}
	};

	useEffect(() => {
		setupComponent().then();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const updateSuggestedWords = (_mnemonic = ''): void => {
		try {
			const lastWord = getLastWordInString(_mnemonic);
			if (!lastWord) {
				setSuggestedWords([]);
				return;
			}
			const _suggestedWords = wordlist.filter((word) =>
				word.substr(0, lastWord.length).includes(lastWord.toLowerCase()),
			);
			if (validateMnemonic(_mnemonic)) {
				setSuggestedWords([]);
				return;
			}
			setSuggestedWords(_suggestedWords);
		} catch (e) {}
	};

	const updateMnemonic = (_mnemonic = ''): void => {
		try {
			if (_mnemonic === '') {
				setMnemonic(_mnemonic);
			}
			_mnemonic = _mnemonic.toLowerCase().replace('.', ' ');
			//Remove duplicate whitespaces/tabs/newlines
			_mnemonic = _mnemonic.replace(/\s\s+/g, ' ');
			setMnemonic(_mnemonic);
			updateSuggestedWords(_mnemonic);
		} catch (e) {}
	};

	const mnemonicsMatch = (): boolean => {
		return currentMnemonic === mnemonic.trim();
	};

	const canUpdateMnemonic = (): boolean => {
		return validateMnemonic(mnemonic) && !mnemonicsMatch();
	};

	const addWordToMnemonic = (word = ''): void => {
		const lastIndex = mnemonic.lastIndexOf(' ');
		let _mnemonic = mnemonic.substring(0, lastIndex);
		_mnemonic = _mnemonic ? `${_mnemonic} ${word} ` : `${word} `;
		updateMnemonic(_mnemonic);
	};

	const getButtonText = (): string => {
		if (mnemonicsMatch()) {
			return 'Current Phrase';
		}
		if (validateMnemonic(mnemonic)) {
			return 'Update Phrase';
		}
		return 'Invalid Phrase';
	};

	const saveMnemonic = async (): Promise<void> => {
		if (canUpdateMnemonic()) {
			setLoading(true);
			await setKeychainValue({ key: selectedWallet, value: mnemonic.trim() });
			await resetSelectedWallet({ selectedWallet });
			await setCurrentMnemonic(mnemonic);
			setLoading(false);
		}
	};

	const getRandomMnemonic = async (): Promise<void> => {
		const newMnemonic = await generateMnemonic();
		setMnemonic(newMnemonic);
	};

	const clearChanges = (): void => {
		setMnemonic(currentMnemonic);
		updateSuggestedWords(currentMnemonic);
	};

	return (
		<SafeAreaView>
			<TouchableOpacity
				activeOpacity={1}
				onPress={Keyboard.dismiss}
				style={styles.container}>
				<NavigationHeader title="Manage Seed Phrase" />
				<View style={styles.content}>
					<TextInput
						placeholder="Please enter your mnemonic phrase here with each word separated by a space... Ex: (project globe magnet)"
						style={styles.textInput}
						selectionColor={'orange'}
						autoCapitalize="none"
						// @ts-ignore autoCompleteType -> autoComplete in newer version
						autoCompleteType="off"
						autoCorrect={false}
						onChangeText={(txt): void => updateMnemonic(txt)}
						value={mnemonic || ''}
						multiline={true}
					/>
					<Button
						color="onSurface"
						style={styles.updateButton}
						text={getButtonText()}
						disabled={!canUpdateMnemonic()}
						loading={loading}
						onPress={saveMnemonic}
					/>
					<Button
						color="onSurface"
						style={styles.updateButton}
						text="Generate Random Phrase"
						onPress={getRandomMnemonic}
					/>
					{!mnemonicsMatch() && (
						<Pressable onPress={clearChanges}>
							<Text>Clear Changes</Text>
						</Pressable>
					)}
					<FlatList
						showsHorizontalScrollIndicator={false}
						keyboardShouldPersistTaps={'handled'}
						horizontal={true}
						data={suggestedWords}
						extraData={suggestedWords}
						keyExtractor={(word): string => word}
						renderItem={({ item: word }): ReactElement => {
							return (
								<Button
									onPress={(): void => addWordToMnemonic(word)}
									color="onSurface"
									text={word}
									style={styles.updateButton}
								/>
							);
						}}
					/>
				</View>
				<View style={styles.footer} />
			</TouchableOpacity>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: 'center',
	},
	textInput: {
		width: '80%',
		minHeight: 140,
		borderRadius: 10,
		padding: 10,
		textAlign: 'left',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 'bold',
		fontSize: 16,
	},
	updateButton: {
		marginTop: 20,
		marginHorizontal: 5,
	},
	footer: {
		flex: 0.6,
	},
});

export default ManageSeedPhrase;
