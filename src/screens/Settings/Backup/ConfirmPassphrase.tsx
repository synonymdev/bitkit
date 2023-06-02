import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheetTextInput } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import { useBottomSheetBackPress } from '../../../hooks/bottomSheet';
import type { BackupScreenProps } from '../../../navigation/types';

const ConfirmPassphrase = ({
	navigation,
	route,
}: BackupScreenProps<'ConfirmPassphrase'>): ReactElement => {
	const { t } = useTranslation('security');
	const { bip39Passphrase: origPass } = route.params;
	const [bip39Passphrase, setPassphrase] = useState<string>('');

	useBottomSheetBackPress('backupNavigation');

	return (
		<GradientView style={styles.gradient}>
			<BottomSheetNavigationHeader title={t('pass_confirm')} />
			<View style={styles.container}>
				<Text01S color="gray1">{t('pass_confirm_text')}</Text01S>

				<View style={styles.input}>
					<BottomSheetTextInput
						value={bip39Passphrase}
						placeholder={t('pass')}
						returnKeyType="done"
						onChangeText={setPassphrase}
						autoCapitalize="none"
						autoComplete="off"
						autoCorrect={false}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						disabled={bip39Passphrase !== origPass}
						size="large"
						text={t('continue')}
						onPress={(): void => navigation.navigate('Result')}
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
	input: {
		marginTop: 32,
		flex: 1,
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(ConfirmPassphrase);
