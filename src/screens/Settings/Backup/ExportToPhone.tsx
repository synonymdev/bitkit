import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Share, { ShareOptions } from 'react-native-share';
import { useTranslation } from 'react-i18next';

import { TextInput, View } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import NavigationHeader from '../../../components/NavigationHeader';
import KeyboardAvoidingView from '../../../components/KeyboardAvoidingView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import {
	cleanupBackupFiles,
	createBackupFile,
} from '../../../utils/backup/fileBackup';
import type { SettingsScreenProps } from '../../../navigation/types';

const ExportToPhone = ({
	navigation,
}: SettingsScreenProps<'ExportToPhone'>): ReactElement => {
	const { t } = useTranslation('backup');
	const [password, setPassword] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		return (): void => {
			cleanupBackupFiles().catch();
		};
	}, []);

	const shareToFiles = async (filePath: string): Promise<void> => {
		const shareOptions: ShareOptions = {
			title: t('export_share'),
			failOnCancel: false,
			saveToFiles: true,
			urls: [filePath],
		};

		try {
			const res = await Share.open(shareOptions);

			if (res.success) {
				showSuccessNotification({
					title: t('export_success_title'),
					message: t('export_success_msg'),
				});
				navigation.goBack();
			}
		} catch (error) {
			if (JSON.stringify(error).indexOf('CANCELLED') < 0) {
				showErrorNotification({
					title: t('export_error_title'),
					message: t('export_error_msg'),
				});
			}
		}
	};

	const onCreateBackup = async (): Promise<void> => {
		setIsCreating(true);

		const fileRes = await createBackupFile(password);

		if (fileRes.isErr()) {
			setIsCreating(false);
			return showErrorNotification({
				title: t('export_error_file'),
				message: fileRes.error.message,
			});
		}

		await shareToFiles(fileRes.value);

		setIsCreating(false);
	};

	return (
		<View style={styles.root}>
			<NavigationHeader
				title={t('export_title')}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<KeyboardAvoidingView style={styles.content}>
				<Text01S color="gray1">{t('export_text')}</Text01S>
				<TextInput
					style={styles.textField}
					placeholder={t('export_password')}
					value={password}
					onChangeText={setPassword}
					autoCapitalize="none"
					autoComplete="off"
					autoCorrect={false}
					returnKeyType="done"
				/>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						disabled={!password || isCreating}
						text={t('export_button')}
						onPress={onCreateBackup}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</KeyboardAvoidingView>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	textField: {
		marginTop: 32,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
		marginTop: 16,
	},
});

export default memo(ExportToPhone);
