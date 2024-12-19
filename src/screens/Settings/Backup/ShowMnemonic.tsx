import React, { memo, ReactElement, useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';

import { View as ThemedView } from '../../../styles/components';
import { BodyM, BodyMSB, BodyS } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import BlurView from '../../../components/BlurView';
import { getMnemonicPhrase, getBip39Passphrase } from '../../../utils/wallet';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import { showToast } from '../../../utils/notifications';
import { vibrate } from '../../../utils/helpers';
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
		<BodyMSB style={styles.word}>
			<BodyMSB color="secondary">{number}.</BodyMSB>
			<BodyMSB> {word}</BodyMSB>
		</BodyMSB>
	);
};

const ShowMnemonic = ({
	navigation,
}: BackupScreenProps<'ShowMnemonic'>): ReactElement => {
	const { t } = useTranslation('security');
	const [show, setShow] = useState(false);
	const [seed, setSeed] = useState<string[]>([]);
	const [bip39Passphrase, setPassphrase] = useState<string>('');

	useBottomSheetBackPress('backupNavigation');

	useEffect(() => {
		const getSeed = async (): Promise<void> => {
			const mnemoncicResult = await getMnemonicPhrase();
			const bip39PassphraseResult = await getBip39Passphrase();

			if (mnemoncicResult.isErr()) {
				console.log('getMnemonicPhrase error:', mnemoncicResult.error.message);
				showToast({
					type: 'warning',
					title: t('mnemonic_error'),
					description: t('mnemonic_error_description'),
				});
				return;
			}

			setSeed(mnemoncicResult.value.split(' '));
			setPassphrase(bip39PassphraseResult);
		};

		getSeed();
	}, [t]);

	const revealMnemonic = (): void => {
		setShow(true);
	};

	const copyMnemonic = (): void => {
		Clipboard.setString(seed.join(' '));
		vibrate();
	};

	const seedToShow = Platform.OS === 'android' && !show ? dummySeed : seed;

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('mnemonic_your')}
				showBackButton={false}
			/>

			<BodyM color="secondary">
				{show
					? t('mnemonic_write', { length: seedToShow.length })
					: t('mnemonic_use')}
			</BodyM>

			<View
				style={styles.seedContainer}
				testID="SeedContaider"
				accessibilityLabel={seed.join(' ')}>
				<ThemedView color="white10" style={styles.seed}>
					<TouchableOpacity
						style={styles.seed2}
						activeOpacity={1}
						onLongPress={copyMnemonic}>
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
					</TouchableOpacity>
				</ThemedView>

				{!show && (
					<BlurView style={styles.blur}>
						<Button
							size="large"
							text={t('mnemonic_reveal')}
							color="black50"
							onPress={revealMnemonic}
							testID="TapToReveal"
						/>
					</BlurView>
				)}
			</View>

			<BodyS color="secondary">
				<Trans
					t={t}
					i18nKey="mnemonic_never_share"
					components={{ accent: <BodyS color="brand" /> }}
				/>
			</BodyS>

			<View style={styles.buttonContainer}>
				<Button
					size="large"
					text={t('continue')}
					disabled={!show}
					testID="ContinueShowMnemonic"
					onPress={(): void => {
						navigation.navigate(
							bip39Passphrase ? 'ShowPassphrase' : 'ConfirmMnemonic',
							{
								seed,
								bip39Passphrase,
							},
						);
					}}
				/>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
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
		borderRadius: 16,
	},
	seed2: {
		flexDirection: 'row',
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
	buttonContainer: {
		marginTop: 'auto',
	},
	word: {
		marginBottom: 8,
	},
});

export default memo(ShowMnemonic);
