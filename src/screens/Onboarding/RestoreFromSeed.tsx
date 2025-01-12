import * as bip39 from 'bip39';
import React, {
	ReactElement,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	Keyboard,
	NativeSyntheticEvent,
	StyleSheet,
	TextInput as TTextInput,
	TextInputKeyPressEventData,
	View,
} from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';
import rnAndroidKeyboardAdjust from 'rn-android-keyboard-adjust';

import {
	ScrollView,
	TextInput,
	View as ThemedView,
} from '../../styles/components';
import { BodyM, BodyS, Display } from '../../styles/text';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import SeedInput from '../../components/SeedInput';
import SeedInputAccessory from '../../components/SeedInputAccessory';
import VerticalShadow from '../../components/VerticalShadow';
import Button from '../../components/buttons/Button';
import { useAppDispatch } from '../../hooks/redux';
import { OnboardingStackScreenProps } from '../../navigation/types';
import { updateUser } from '../../store/slices/user';
import { verifyBackup } from '../../store/slices/settings';
import { validateMnemonic } from '../../utils/wallet';

const RestoreFromSeed = ({
	navigation,
}: OnboardingStackScreenProps<'RestoreFromSeed'>): ReactElement => {
	const numberOfWords = 12;
	const dispatch = useAppDispatch();
	const [seed, setSeed] = useState(Array(numberOfWords).fill(undefined));
	const [validWords, setValidWords] = useState(Array(numberOfWords).fill(true));
	const [focused, setFocused] = useState<number | null>(null);
	const [showPassphrase, setShowPassphrase] = useState(false);
	const [bip39Passphrase, setPassphrase] = useState<string>('');
	const inputRefs = useRef<Array<TTextInput>>([]);
	const passRef = useRef<TTextInput>(null);
	const { t } = useTranslation('onboarding');
	const enableButtons = useMemo(
		() =>
			!seed.includes(undefined) &&
			!validWords.includes(false) &&
			validateMnemonic(seed.join(' ')),
		[seed, validWords],
	);
	const showRedExplanation = useMemo(
		() => seed.some((word, index) => word !== undefined && !validWords[index]),
		[seed, validWords],
	);
	const showInvalidChecksum = useMemo(
		() =>
			!seed.includes(undefined) &&
			!validWords.includes(false) &&
			!validateMnemonic(seed.join(' ')),
		[seed, validWords],
	);

	const onSeedChange = (index: number, text: string): void => {
		text = text.trim();
		// detect if user pastes whole seed in first input
		if (text.split(' ').length === numberOfWords) {
			setSeed(text.split(' '));
			Keyboard.dismiss();
			return;
		}

		setSeed((items) => {
			items[index] = text;
			return [...items];
		});
	};

	// Make sure SeedInputAccessory is showing on Android
	useEffect(() => {
		rnAndroidKeyboardAdjust.setAdjustResize();

		return (): void => {
			rnAndroidKeyboardAdjust.setAdjustPan();
		};
	}, []);

	const handleFocus = (index: number): void => {
		setFocused(index);
	};

	const handleBlur = (index: number): void => {
		setFocused(null);
		setValidWords((items) => {
			items[index] = bip39.wordlists.english.includes(seed[index]);
			return [...items];
		});
	};

	const handleRestore = async (): Promise<void> => {
		dispatch(verifyBackup());
		// Tells component within slashtags provider that it needs to handle restoring from remote backup
		dispatch(updateUser({ requiresRemoteRestore: true }));
		navigation.navigate('CreateWallet', {
			action: 'restore',
			mnemonic: seed.join(' '),
			bip39Passphrase,
		});
	};

	const handleAdvanced = (): void => {
		setShowPassphrase(true);
		setTimeout(() => passRef.current?.focus(), 100);
	};

	const handleSubmitEditing = (): void => {
		if (focused === null || focused > numberOfWords - 2) {
			// last input
			return;
		}
		inputRefs.current[focused + 1].focus();
	};

	const handleKeyPress = ({
		nativeEvent,
	}: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
		if (nativeEvent.key !== 'Backspace' || !focused || seed[focused]) {
			return;
		}

		inputRefs.current[focused - 1].focus();
	};

	const renderInput = (word: string, index: number): ReactElement => {
		// input is incorrect when it has been touched
		const invalid = word !== undefined && !validWords[index];
		return (
			<SeedInput
				key={index}
				ref={(el: TTextInput): void => {
					inputRefs.current[index] = el;
				}}
				index={index}
				valid={!invalid}
				value={word ?? ''}
				onChangeText={(text): void => onSeedChange(index, text)}
				onFocus={(): void => handleFocus(index)}
				onBlur={(): void => handleBlur(index)}
				onSubmitEditing={handleSubmitEditing}
				onKeyPress={handleKeyPress}
				editable={!showPassphrase}
			/>
		);
	};

	return (
		<ThemedView style={styles.root}>
			<View style={styles.header}>
				<SafeAreaInset type="top" />
				<NavigationHeader showCloseButton={false} />
			</View>

			<ScrollView
				color="transparent"
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				bounces={false}
				stickyHeaderIndices={[0]}>
				<View style={styles.shadowContainer}>
					<VerticalShadow />
				</View>
				<View>
					<View style={styles.title}>
						<Display>
							<Trans
								t={t}
								i18nKey="restore_header"
								components={{ accent: <Display color="blue" /> }}
							/>
						</Display>
					</View>
					<BodyM color="white80">{t('restore_phrase')}</BodyM>
				</View>
				<View style={styles.inputsContainer}>
					<View style={styles.inputsColumn}>
						{seed.slice(0, seed.length / 2).map(renderInput)}
					</View>

					<View style={styles.inputsColumn}>
						{seed
							.slice(-seed.length / 2)
							.map((word, index) => renderInput(word, index + seed.length / 2))}
					</View>
				</View>

				{showRedExplanation && (
					<BodyS color="secondary" style={styles.explanation}>
						<Trans
							t={t}
							i18nKey="restore_red_explain"
							components={{ accent: <BodyS color="red" /> }}
						/>
					</BodyS>
				)}

				{showInvalidChecksum && (
					<BodyS color="red" style={styles.explanation}>
						{t('restore_inv_checksum')}
					</BodyS>
				)}

				{showPassphrase && (
					<>
						<TextInput
							style={styles.passphrase}
							ref={passRef}
							value={bip39Passphrase}
							returnKeyType="done"
							autoCapitalize="none"
							autoCompleteType="off"
							autoCorrect={false}
							placeholder={t('restore_passphrase_placeholder')}
							testID="PassphraseInput"
							onChangeText={setPassphrase}
							onSubmitEditing={handleSubmitEditing}
						/>
						<BodyS color="secondary" style={styles.explanation}>
							{t('restore_passphrase_meaning')}
						</BodyS>
					</>
				)}

				<View style={styles.buttonsContainer}>
					{!showPassphrase && (
						<Button
							style={styles.button}
							text={t('advanced')}
							size="large"
							variant="secondary"
							disabled={!enableButtons}
							onPress={handleAdvanced}
							testID="AdvancedButton"
						/>
					)}

					<Button
						style={styles.button}
						text={t(showPassphrase ? 'restore_wallet' : 'restore')}
						size="large"
						disabled={!enableButtons}
						onPress={handleRestore}
						testID="RestoreButton"
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>

			{showPassphrase ? (
				<KeyboardAccessoryView hideBorder androidAdjustResize avoidKeyboard>
					{/* biome-ignore lint/complexity/noUselessFragments: children expected */}
					<></>
				</KeyboardAccessoryView>
			) : (
				<SeedInputAccessory
					label={t('restore_suggestions')}
					word={focused !== null ? seed[focused] : null}
					setWord={(text): void => {
						if (focused === null) {
							return;
						}
						onSeedChange(focused, text);
						if (focused > numberOfWords - 2) {
							// last input
							Keyboard.dismiss();
							return;
						}
						inputRefs.current[focused + 1].focus();
					}}
				/>
			)}
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	header: {
		position: 'absolute',
		top: 0,
		zIndex: 1,
	},
	shadowContainer: {
		height: 120,
		marginHorizontal: -50,
	},
	content: {
		flexGrow: 1,
		justifyContent: 'space-between',
		paddingTop: 16,
		paddingHorizontal: 32,
	},
	title: {
		marginBottom: 4,
	},
	inputsContainer: {
		flexDirection: 'row',
		marginTop: 44,
		gap: 4,
	},
	inputsColumn: {
		flex: 1,
	},
	explanation: {
		marginTop: 16,
	},
	passphrase: {
		fontSize: 17,
		fontWeight: '600',
		letterSpacing: 0.4,
	},
	buttonsContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
	},
	button: {
		flex: 1,
		marginTop: 28,
		marginHorizontal: 8,
	},
});

export default RestoreFromSeed;
