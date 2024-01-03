import React, { memo, ReactElement, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, Platform, TouchableOpacity } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';
import Clipboard from '@react-native-clipboard/clipboard';

import { View as ThemedView } from '../../../styles/components';
import { Text01S, Text01M, Text02S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
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
		<Text01M style={styles.word}>
			<Text01M color="white50">{number}.</Text01M>
			<Text01M> {word}</Text01M>
		</Text01M>
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
		getMnemonicPhrase().then((res) => {
			if (res.isErr()) {
				console.log(res.error.message);
				showToast({
					type: 'error',
					title: t('mnemonic_error'),
					description: t('mnemonic_error_description'),
				});
				return;
			}
			setSeed(res.value.split(' '));
		});
		getBip39Passphrase().then(setPassphrase);
	}, [t]);

	const seedToShow = useMemo(
		() => (Platform.OS === 'android' && !show ? dummySeed : seed),
		[seed, show],
	);

	return (
		<View style={styles.container}>
			<BottomSheetNavigationHeader
				title={t('mnemonic_your')}
				displayBackButton={false}
			/>

			<Text01S color="gray1">
				{show
					? t('mnemonic_write', { length: seedToShow.length })
					: t('mnemonic_use')}
			</Text01S>

			<View
				style={styles.seedContainer}
				testID="SeedContaider"
				accessibilityLabel={seed.join(' ')}>
				<ThemedView color="white10" style={styles.seed}>
					<TouchableOpacity
						style={styles.seed2}
						activeOpacity={1}
						onLongPress={(): void => {
							Clipboard.setString(seed.join(' '));
							vibrate();
						}}>
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
							color="black5"
							onPress={(): void => setShow(true)}
							testID="TapToReveal"
						/>
					</BlurView>
				)}
			</View>

			<Text02S color="gray1">
				<Trans
					t={t}
					i18nKey="mnemonic_never_share"
					components={{
						brand: <Text02S color="brand" />,
					}}
				/>
			</Text02S>

			<View style={styles.buttonContainer}>
				{show && (
					<Button
						size="large"
						text={t('continue')}
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
