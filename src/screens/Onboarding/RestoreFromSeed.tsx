import React, {
	ReactElement,
	useState,
	useRef,
	useEffect,
	useMemo,
} from 'react';
import {
	Keyboard,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from 'react-native';
import * as bip39 from 'bip39';
import rnAndroidKeyboardAdjust from 'rn-android-keyboard-adjust';
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory';

import { Display, Text01S, Text02S } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import SeedInput from '../../components/SeedInput';
import SeedInputAccessory from '../../components/SeedInputAccessory';
import VerticalShadow from '../../components/VerticalShadow';
import Button from '../../components/Button';
import { validateMnemonic } from '../../utils/wallet';
import { restoreSeed } from '../../utils/startup';
import LoadingWalletScreen from './Loading';
import NavigationHeader from '../../components/NavigationHeader';
import { updateUser, verifyBackup } from '../../store/actions/user';
import { showErrorNotification } from '../../utils/notifications';

const RestoreFromSeed = (): ReactElement => {
	const numberOfWords = 12;
	const [seed, setSeed] = useState(Array(numberOfWords).fill(undefined));
	const [isRestoringWallet, setIsRestoringWallet] = useState(false);
	const [validWords, setValidWords] = useState(Array(numberOfWords).fill(true));
	const [focused, setFocused] = useState(null);
	const [showPassphrase, setShowPassphrase] = useState(false);
	const [bip39Passphrase, setPassphrase] = useState<string>('');
	const inputRefs = useRef<Array<TextInput>>([]);
	const passRef = useRef<TextInput>(null);
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

	const onSeedChange = (index, text): void => {
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

		return () => {
			rnAndroidKeyboardAdjust.setAdjustPan();
		};
	}, []);

	const handleFocus = (index): void => {
		setFocused(index);
	};

	const handleBlur = (index): void => {
		setFocused(null);
		setValidWords((items) => {
			items[index] = bip39.wordlists.english.includes(seed[index]);
			return [...items];
		});
	};

	const handleRestore = async (): Promise<void> => {
		setIsRestoringWallet(true);
		verifyBackup();

		const res = await restoreSeed({
			mnemonic: seed.join(' '),
			bip39Passphrase,
		});
		if (res.isErr()) {
			showErrorNotification({
				title: 'Error Restoring Wallet',
				message: res.error.message,
			});
			return;
		}

		//Tells component within slashtags provider that it needs to handle restoring from remote backup
		updateUser({ requiresRemoteRestore: true });
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

	const handleKeyPress = ({ nativeEvent }): void => {
		if (nativeEvent.key !== 'Backspace' || !focused || seed[focused]) {
			return;
		}

		inputRefs.current[focused - 1].focus();
	};

	const renderInput = (word, index): ReactElement => {
		// input is incorrect when it has been touched
		const invalid = word !== undefined && !validWords[index];
		return (
			<SeedInput
				key={index}
				ref={(el: TextInput): void => {
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

	if (isRestoringWallet) {
		return (
			<GlowingBackground key="back" topLeft="brand">
				<LoadingWalletScreen />
			</GlowingBackground>
		);
	}

	return (
		<GlowingBackground key="back" topLeft="blue">
			<View style={styles.header}>
				<SafeAreaInsets type="top" />
				<NavigationHeader displayBackButton={true} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				bounces={false}
				stickyHeaderIndices={[0]}>
				<View style={styles.shadowContainer}>
					<VerticalShadow />
				</View>
				<View>
					<View style={styles.title}>
						<Display>Restore</Display>
						<Display>your Wallet</Display>
					</View>
					<Text01S color="white8">
						Please type in your recovery phrase from any (paper) backup.
					</Text01S>
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
					<Text02S color="gray1" style={styles.explanation}>
						If a word is shown in <Text02S color="red">red</Text02S>, it means
						that it was not found in the recovery phrase dictionary. Check for
						spelling errors.
					</Text02S>
				)}

				{showInvalidChecksum && (
					<Text02S color="red" style={styles.explanation}>
						The checksum for the recovery phrase appears to be incorrect. Please
						double check your recovery phrase.
					</Text02S>
				)}

				{showPassphrase && (
					<>
						<SeedInput
							ref={passRef}
							value={bip39Passphrase}
							onChangeText={setPassphrase}
							onSubmitEditing={handleSubmitEditing}
							placeholder="Passphrase*"
							valid={true}
						/>
						<Text02S color="gray1" style={styles.explanation}>
							*Optional, enter only if you’ve set up one.
						</Text02S>
					</>
				)}

				<View style={styles.buttonsContainer}>
					{!showPassphrase && (
						<Button
							disabled={!enableButtons}
							size="large"
							style={styles.button}
							onPress={handleAdvanced}
							text="Advanced"
							variant="secondary"
						/>
					)}

					<Button
						disabled={!enableButtons}
						size="large"
						style={styles.button}
						onPress={handleRestore}
						text={showPassphrase ? 'Restore Wallet' : 'Restore'}
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</ScrollView>

			{showPassphrase ? (
				<KeyboardAccessoryView hideBorder androidAdjustResize avoidKeyboard>
					<></>
				</KeyboardAccessoryView>
			) : (
				<SeedInputAccessory
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
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	header: {
		position: 'absolute',
		top: 0,
		zIndex: 1,
	},
	shadowContainer: {
		height: 120,
		marginHorizontal: -50,
		marginBottom: -30,
	},
	content: {
		paddingHorizontal: 48,
		paddingBottom: 16,
		flexGrow: 1,
		justifyContent: 'space-between',
	},
	title: {
		marginBottom: 8,
	},
	inputsContainer: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		paddingHorizontal: -2,
		marginTop: 38,
	},
	inputsColumn: {
		width: '50%',
	},
	explanation: {
		marginTop: 16,
	},
	buttonsContainer: {
		marginTop: 28,
		marginHorizontal: -8,
		flexDirection: 'row',
	},
	button: {
		flex: 1,
		marginHorizontal: 8,
	},
});

export default RestoreFromSeed;
