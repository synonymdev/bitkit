import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Text01M, Text01S } from '../../styles/text';
import { showErrorNotification } from '../../utils/notifications';
import { getBip39Passphrase, getMnemonicPhrase } from '../../utils/wallet';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import { Word } from '../Settings/Backup/ShowMnemonic';
import { RecoveryStackScreenProps } from '../../navigation/types';

const Mnemonic = ({
	navigation,
}: RecoveryStackScreenProps<'Mnemonic'>): ReactElement => {
	const { t } = useTranslation('security');
	const [seed, setSeed] = useState<string[]>([]);
	const [passphrase, setPassphrase] = useState('');
	const insets = useSafeAreaInsets();

	useEffect(() => {
		const getSeed = async (): Promise<void> => {
			const mnemoncicResult = await getMnemonicPhrase();
			const bip39Passphrase = await getBip39Passphrase();

			if (mnemoncicResult.isErr()) {
				showErrorNotification({
					title: t('mnemonic_error'),
					message: mnemoncicResult.error.message,
				});
				return;
			}

			setSeed(mnemoncicResult.value.split(' '));
			setPassphrase(bip39Passphrase);
		};

		getSeed();
	}, [t]);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const onBack = (): void => navigation.goBack();

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title={t('mnemonic_phrase')} />
			<View style={styles.content}>
				<Text01S style={styles.text} color="gray1">
					{t('mnemonic_write', { length: seed.length })}
				</Text01S>

				<ThemedView color="gray324" style={styles.seed}>
					<View style={styles.col}>
						{seed.slice(0, seed.length / 2).map((w, i) => (
							<Word key={i} word={w} number={i + 1} />
						))}
					</View>
					<View style={styles.col}>
						{seed.slice(-seed.length / 2).map((w, i) => (
							<Word key={i} word={w} number={seed.length / 2 + i + 1} />
						))}
					</View>
				</ThemedView>

				{passphrase !== '' && (
					<View style={styles.passphrase}>
						<Text01S style={styles.passphrase} color="gray1">
							{t('pass_text')}
						</Text01S>
						<Text01M>
							<Trans
								t={t}
								i18nKey="pass_recovery"
								components={{
									gray: <Text01M color="gray1" />,
								}}
								values={{ passphrase }}
							/>
						</Text01M>
					</View>
				)}

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						text={t('back')}
						size="large"
						onPress={onBack}
					/>
				</View>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		marginBottom: 16,
	},
	seed: {
		borderRadius: 16,
		paddingTop: 32,
		paddingBottom: 24,
		paddingHorizontal: 16,
		flexDirection: 'row',
		marginBottom: 32,
	},
	col: {
		marginHorizontal: 16,
		flex: 1,
	},
	passphrase: {
		marginBottom: 16,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
});

export default Mnemonic;
