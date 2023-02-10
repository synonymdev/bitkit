import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView } from '../../../styles/components';
import { Text01S, Text01M, Text02S } from '../../../styles/text';
import Button from '../../../components/Button';
import BlurView from '../../../components/BlurView';
import { getMnemonicPhrase, getBip39Passphrase } from '../../../utils/wallet';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import { showErrorNotification } from '../../../utils/notifications';
import type { BackupScreenProps } from '../../../navigation/types';

// Android doesn't have blur so we put a dummy mnemonic
const dummySeed = Array.from({ length: 12 }, () => 'secret');

export const Word = ({
	number,
	word,
}: {
	number: number;
	word: string;
}): ReactElement => {
	return (
		<Text01M style={styles.word}>
			<Text01M color="white5">{number}.</Text01M>
			<Text01M> {word}</Text01M>
		</Text01M>
	);
};

const ShowMnemonic = ({
	navigation,
}: BackupScreenProps<'ShowMnemonic'>): ReactElement => {
	const [show, setShow] = useState(false);
	const [seed, setSeed] = useState<string[]>([]);
	const [bip39Passphrase, setPassphrase] = useState<string>('');
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	useBottomSheetBackPress('backupNavigation');

	useEffect(() => {
		getMnemonicPhrase().then((res) => {
			if (res.isErr()) {
				showErrorNotification({
					title: 'Error Getting Mnemonic',
					message: res.error.message,
				});
				return;
			}
			setSeed(res.value.split(' '));
		});
		getBip39Passphrase().then(setPassphrase);
	}, []);

	const seedToShow = useMemo(
		() => (Platform.OS === 'android' && !show ? dummySeed : seed),
		[seed, show],
	);

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title="Your Recovery Phrase"
				displayBackButton={false}
			/>

			{show ? (
				<Text01S color="gray1">
					Write down these {seedToShow.length} words in the right order and
					store them in a safe place.
				</Text01S>
			) : (
				<Text01S color="gray1">
					Use the 12 words below to recover your money at a later date.
				</Text01S>
			)}

			<View
				style={styles.seedContainer}
				testID="SeedContaider"
				accessibilityLabel={seed.join(' ')}>
				<ThemedView color="gray324" style={styles.seed}>
					<View style={styles.col}>
						{seedToShow.slice(0, seedToShow.length / 2).map((w, i) => (
							<Word key={i} word={w} number={i + 1} />
						))}
					</View>
					<View style={styles.col}>
						{seedToShow.slice(-seedToShow.length / 2).map((w, i) => (
							<Word key={i} word={w} number={seedToShow.length / 2 + i + 1} />
						))}
					</View>
				</ThemedView>

				{!show && (
					<BlurView style={styles.blur}>
						<Button
							size="large"
							text="Tap To Reveal"
							color="black5"
							onPress={(): void => setShow(true)}
							testID="TapToReveal"
						/>
					</BlurView>
				)}
			</View>

			<Text02S color="gray1">
				<Text02S color="brand">Never share</Text02S> your recovery phrase with
				anyone as this may result in the loss of funds.
			</Text02S>

			<View style={nextButtonContainer}>
				{show && (
					<Button
						size="large"
						text="Continue"
						onPress={(): void => {
							navigation.navigate(
								bip39Passphrase ? 'ShowPassphrase' : 'ConfirmMnemonic',
								{
									seed,
									bip39Passphrase,
								},
							);
						}}
						testID="ContinueShowMnemonic"
					/>
				)}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 32,
	},
	seedContainer: {
		marginVertical: 32,
		position: 'relative',
	},
	seed: {
		paddingTop: 32,
		paddingBottom: 24,
		paddingHorizontal: 16,
		flexDirection: 'row',
		borderRadius: 16,
	},
	col: {
		marginHorizontal: 16,
		flex: 1,
	},
	blur: {
		position: 'absolute',
		justifyContent: 'center',
		alignItems: 'center',
		top: 5,
		right: 5,
		left: 5,
		bottom: 5,
		borderRadius: 10,
	},
	nextButtonContainer: {
		marginTop: 'auto',
		width: '100%',
	},
	word: {
		marginBottom: 8,
	},
});

export default memo(ShowMnemonic);
