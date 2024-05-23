import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Trans, useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../../styles/components';
import { BodyM, BodyMSB, BodyS } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import type { BackupScreenProps } from '../../../navigation/types';

const ShowPassphrase = ({
	navigation,
	route,
}: BackupScreenProps<'ShowPassphrase'>): ReactElement => {
	const { t } = useTranslation('security');
	const { bip39Passphrase, seed } = route.params;

	useBottomSheetBackPress('backupNavigation');

	return (
		<GradientView style={styles.gradient}>
			<BottomSheetNavigationHeader title={t('pass_your')} />
			<View style={styles.container}>
				<BodyM color="secondary">{t('pass_text')}</BodyM>

				<ThemedView color="white10" style={styles.passphrase}>
					<BottomSheetScrollView>
						<BodyMSB color="secondary" style={styles.p}>
							{t('pass')}
						</BodyMSB>
						<BodyMSB>{bip39Passphrase}</BodyMSB>
					</BottomSheetScrollView>
				</ThemedView>

				<BodyS color="secondary">
					<Trans
						t={t}
						i18nKey="pass_never_share"
						components={{ accent: <BodyS color="brand" /> }}
					/>
				</BodyS>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						text={t('continue')}
						onPress={(): void =>
							navigation.navigate('ConfirmMnemonic', { seed, bip39Passphrase })
						}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	gradient: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingHorizontal: 32,
	},
	passphrase: {
		borderRadius: 16,
		marginVertical: 32,
		padding: 32,
		minHeight: 235,
	},
	p: {
		marginBottom: 8,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ShowPassphrase);
