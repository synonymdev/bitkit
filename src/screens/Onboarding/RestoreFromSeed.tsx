import React, {
	ReactElement,
	useState,
	useRef,
	useEffect,
	useMemo,
} from 'react';
import {
	Alert,
	Image,
	Keyboard,
	ScrollView,
	StyleSheet,
	TextInput,
	View,
} from 'react-native';
import * as bip39 from 'bip39';
import {
	Canvas,
	RadialGradient,
	Rect,
	runTiming,
	useValue,
	vec,
} from '@shopify/react-native-skia';

import { Display, Text01S } from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import SeedInput from '../../components/SeedInput';
import SeedInputAccessory from '../../components/SeedInputAccessory';
import VerticalShadow from '../../components/VerticalShadow';
import Button from '../../components/Button';
import { verifyBackup } from '../../store/actions/user';
import { validateMnemonic } from '../../utils/wallet';
import useColors from '../../hooks/colors';
import { restoreWallet } from '../../utils/startup';
import LoadingWalletScreen from './Loading';
import NavigationHeader from '../../components/NavigationHeader';
import rnAndroidKeyboardAdjust from 'rn-android-keyboard-adjust';

const Glow = ({ color }: { color: string }): ReactElement => {
	const opacity = useValue(0);

	useEffect(() => {
		runTiming(opacity, 0.4, { duration: 300 });
	}, [opacity]);

	return (
		<Canvas style={styles.canvas}>
			<Rect x={0} y={0} width={400} height={400} opacity={opacity}>
				<RadialGradient
					c={vec(200, 200)}
					r={200}
					colors={[color, 'transparent']}
				/>
			</Rect>
		</Canvas>
	);
};

const RestoreFromSeed = (): ReactElement => {
	const numberOfWords = 12;
	const [isRestoringWallet, setIsRestoringWallet] = useState(false);
	const [seed, setSeed] = useState(Array(numberOfWords).fill(undefined));
	const [validWords, setValidWords] = useState(Array(numberOfWords).fill(true));
	const [focused, setFocused] = useState(null);
	const inputRefs = useRef<Array<TextInput>>([]);
	const { blue, green, red } = useColors();
	const showRestoreButton = useMemo(
		() => !seed.includes(undefined) && !validWords.includes(false),
		[seed, validWords],
	);
	const showRedExplanation = useMemo(
		() => seed.some((word, index) => word !== undefined && !validWords[index]),
		[seed, validWords],
	);
	const [showRestored, setShowRestored] = useState(false);
	const [showFailed, setShowFailed] = useState(false);

	const onSeedChange = (index, text): void => {
		text = text.trim();
		// decect if user pastes whole seed in first input
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
		if (!validateMnemonic(seed.join(' '))) {
			setShowFailed(true);
			return;
		}

		setIsRestoringWallet(true);
		const res = await restoreWallet({ mnemonic: seed.join(' ') });
		if (res.isErr()) {
			setIsRestoringWallet(false);
			Alert.alert(res.error.message);
			return;
		}

		verifyBackup();
		setShowRestored(true);
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
			/>
		);
	};

	if (isRestoringWallet) {
		return (
			<GlowingBackground topLeft="brand">
				<LoadingWalletScreen />
			</GlowingBackground>
		);
	}

	if (showRestored || showFailed) {
		const color = showRestored ? green : red;
		const title = showRestored ? 'Wallet Restored.' : 'Failed to restore.';
		const subtitle = showRestored
			? 'You have successfully restored your wallet from backup. Enjoy Bitkit!'
			: 'The checksum for the recovery phrase appears to be incorrect.';
		const onPress = showRestored
			? (): void => Alert.alert('TODO')
			: (): void => setShowFailed(false);
		const buttonText = showRestored ? 'Get Started' : 'Try Again';

		return (
			<GlowingBackground topLeft={color}>
				<View style={styles.contentResult}>
					<View>
						<Display style={styles.title}>{title}</Display>
						<Text01S color="white8">{subtitle}</Text01S>
					</View>

					<View style={styles.imageContainer} pointerEvents="none">
						<View style={styles.canvasContainer}>
							<Glow color={color} />
						</View>
						<Image
							style={styles.image}
							source={require('../../assets/illustrations/wallet.png')}
						/>
					</View>

					<View>
						<Button onPress={onPress} size="large" text={buttonText} />
					</View>
				</View>
			</GlowingBackground>
		);
	}

	return (
		<GlowingBackground topLeft={blue}>
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
				<View style={styles.title}>
					<Display>Restore</Display>
					<Display>your Wallet</Display>
				</View>
				<Text01S color="white8">
					Please type in your recovery phrase from any (paper) backup.
				</Text01S>
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

				{showRedExplanation ? (
					<Text01S color="gray1" style={styles.redExplanation}>
						If a word is shown in <Text01S color="red">red</Text01S>, it means
						that it was not found in the recovery phrase dictionary. Check for
						spelling errors.
					</Text01S>
				) : null}

				{showRestoreButton ? (
					<View style={styles.buttonContainer}>
						<Button
							size="large"
							onPress={handleRestore}
							text="Restore Wallet"
						/>
					</View>
				) : null}
				<SafeAreaInsets type="bottom" />
			</ScrollView>
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
	},
	content: {
		paddingHorizontal: 48,
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
	redExplanation: {
		marginTop: 16,
	},
	buttonContainer: {
		marginTop: 38,
	},
	contentResult: {
		paddingHorizontal: 48,
		paddingTop: 120,
		paddingBottom: 120,
		flex: 1,
	},
	imageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		marginHorizontal: -50,
	},
	image: {
		width: 200,
		height: 200,
	},
	canvasContainer: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},
	canvas: {
		width: 400,
		height: 400,
	},
});

export default RestoreFromSeed;
