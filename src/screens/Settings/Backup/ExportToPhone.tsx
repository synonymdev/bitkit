import React, { memo, ReactElement, useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import Share, { ShareOptions } from 'react-native-share';

import { TextInput, View } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import useKeyboard from '../../../hooks/keyboard';
import SafeAreaView from '../../../components/SafeAreaView';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
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
	const { keyboardShown } = useKeyboard();
	const [password, setPassword] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	useEffect(() => {
		return (): void => {
			cleanupBackupFiles().catch();
		};
	}, []);

	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			// extra padding needed because of KeyboardAvoidingView
			paddingBottom: keyboardShown ? (Platform.OS === 'ios' ? 16 : 40) : 0,
		}),
		[keyboardShown],
	);

	const shareToFiles = async (filePath: string): Promise<void> => {
		const shareOptions: ShareOptions = {
			title: 'Share backup file',
			failOnCancel: false,
			saveToFiles: true,
			urls: [filePath],
		};

		try {
			const res = await Share.open(shareOptions);

			if (res.success) {
				showSuccessNotification({
					title: 'Backup exported',
					message: 'Successfully exported file to phone.',
				});
				navigation.goBack();
			}
		} catch (error) {
			if (JSON.stringify(error).indexOf('CANCELLED') < 0) {
				showErrorNotification({
					title: 'Backup failed',
					message: 'Bitkit was not able to save the backup file.',
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
				title: 'Failed to create backup file',
				message: fileRes.error.message,
			});
		}

		await shareToFiles(fileRes.value);

		setIsCreating(false);
	};

	return (
		<SafeAreaView>
			<NavigationHeader
				title="Export To Phone"
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<KeyboardAvoidingView style={styles.content} behavior="padding">
				<Text01S color="gray1">
					You can export a copy of your wallet data as a .ZIP file. This file is
					encrypted with the password you set below.
				</Text01S>
				<TextInput
					style={styles.textField}
					placeholder="Password"
					value={password}
					onChangeText={setPassword}
					autoCapitalize="none"
					// @ts-ignore autoCompleteType -> autoComplete in newer version
					autoCompleteType="off"
					autoCorrect={false}
					returnKeyType="done"
				/>

				<View style={buttonContainerStyles}>
					<Button
						style={styles.button}
						size="large"
						disabled={!password || isCreating}
						text="Export"
						onPress={onCreateBackup}
					/>
				</View>
			</KeyboardAvoidingView>
			<SafeAreaInsets type="bottom" />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
		paddingBottom: 16,
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
