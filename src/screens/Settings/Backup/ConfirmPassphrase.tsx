import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import type { BackupScreenProps } from '../../../navigation/types';
import { BottomSheetTextInput } from '../../../styles/components';
import { BodyM } from '../../../styles/text';
import { capitalize } from '../../../utils/helpers';

const ConfirmPassphrase = ({
	navigation,
	route,
}: BackupScreenProps<'ConfirmPassphrase'>): ReactElement => {
	const { t } = useTranslation('security');
	const { bip39Passphrase: origPass } = route.params;
	const [bip39Passphrase, setPassphrase] = useState<string>('');

	return (
		<GradientView style={styles.gradient}>
			<BottomSheetNavigationHeader title={t('pass_confirm')} />
			<View style={styles.container}>
				<BodyM color="secondary">{t('pass_confirm_text')}</BodyM>

				<View style={styles.input}>
					<BottomSheetTextInput
						value={bip39Passphrase}
						placeholder={capitalize(t('pass'))}
						backgroundColor="white10"
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
						onPress={(): void => navigation.navigate('Warning')}
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
