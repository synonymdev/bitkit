import React, { ReactElement, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { BodyMSB, BodyM } from '../../styles/text';
import { showToast } from '../../utils/notifications';
import { getBip39Passphrase, getMnemonicPhrase } from '../../utils/wallet';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/Button';
import { Word } from '../Settings/Backup/ShowMnemonic';
import { RecoveryStackScreenProps } from '../../navigation/types';

const Mnemonic = ({
	navigation,
}: RecoveryStackScreenProps<'Mnemonic'>): ReactElement => {
	const { t } = useTranslation('security');
	const [seed, setSeed] = useState<string[]>([]);
	const [passphrase, setPassphrase] = useState('');

	useEffect(() => {
		const getSeed = async (): Promise<void> => {
			const mnemoncicResult = await getMnemonicPhrase();
			const bip39Passphrase = await getBip39Passphrase();

			if (mnemoncicResult.isErr()) {
				console.log(mnemoncicResult.error.message);
				showToast({
					type: 'warning',
					title: t('mnemonic_error'),
					description: t('mnemonic_error_description'),
				});
				return;
			}

			setSeed(mnemoncicResult.value.split(' '));
			setPassphrase(bip39Passphrase);
		};

		getSeed();
	}, [t]);

	const onBack = (): void => navigation.goBack();

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('mnemonic_phrase')} />
			<View style={styles.content}>
				<BodyM style={styles.text} color="secondary">
					{t('mnemonic_write', { length: seed.length })}
				</BodyM>

				<ThemedView style={styles.seed} color="white10">
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
						<BodyM style={styles.passphrase} color="secondary">
							{t('pass_text')}
						</BodyM>
						<BodyMSB>
							<Trans
								t={t}
								i18nKey="pass_recovery"
								components={{ accent: <BodyMSB color="secondary" /> }}
								values={{ passphrase }}
							/>
						</BodyMSB>
					</View>
				)}

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('back')}
						size="large"
						onPress={onBack}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
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
