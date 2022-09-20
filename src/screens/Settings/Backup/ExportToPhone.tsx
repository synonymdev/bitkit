import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, Switch, Image } from 'react-native';
import { useSelector } from 'react-redux';
import Share from 'react-native-share';

import { View, Text, TextInput, Text01S } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import themes from '../../../styles/themes';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import {
	cleanupBackupFiles,
	createBackupFile,
} from '../../../utils/backup/fileBackup';
import AuthCheck from '../../../components/AuthCheck';
import SafeAreaView from '../../../components/SafeAreaView';
import Glow from '../../../components/Glow';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import type { SettingsScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/folder.png');

const ExportToPhone = ({
	navigation,
}: SettingsScreenProps<'ExportToPhone'>): ReactElement => {
	const [isEncrypted, setIsEncrypted] = useState<boolean>(true);
	const [isCreating, setIsCreating] = useState<boolean>(false);
	const [password, setPassword] = useState<string>('');

	useEffect(() => {
		return (): void => {
			cleanupBackupFiles().catch();
		};
	}, []);

	const themeColors = useSelector(
		(state: Store) => themes[state.settings.theme].colors,
	);

	const shareToFiles = async (filePath): Promise<void> => {
		const shareOptions = {
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
		if (isEncrypted && !password) {
			return showErrorNotification({
				title: 'Unable to create backup',
				message: 'Password must be set for encrypted backup',
			});
		}

		setIsCreating(true);

		const fileRes = await createBackupFile(isEncrypted ? password : undefined);
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
					navigation.navigate('Tabs');
				}}
			/>
			<AuthCheck>
				<View style={styles.container}>
					<Text01S color="gray1">
						If you want, you can export a copy of all metadata to your phone. Be
						aware, this .zip file will be encrypted with your PIN code.
					</Text01S>

					<View style={styles.row}>
						<Text style={styles.text}>Encrypt backup</Text>
						<Switch
							ios_backgroundColor={themeColors.surface}
							onValueChange={(): void => setIsEncrypted(!isEncrypted)}
							value={isEncrypted}
						/>
					</View>

					{isEncrypted && (
						<View>
							<Text style={styles.title}>Password</Text>
							<TextInput
								textAlignVertical={'center'}
								underlineColorAndroid="transparent"
								style={styles.textInput}
								placeholder="Password"
								autoCapitalize="none"
								autoComplete={'off'}
								autoCorrect={false}
								onChangeText={setPassword}
								value={password}
								textContentType={'newPassword'}
								secureTextEntry
							/>

							<Text style={styles.text2}>
								(Default password is your Backpack password)
							</Text>
						</View>
					)}

					<View style={styles.imageContainer}>
						<Glow style={styles.glow} size={600} color="green" />
						<Image source={imageSrc} style={styles.image} />
					</View>

					<View style={styles.buttonContainer}>
						<Button
							size="large"
							disabled={isCreating}
							style={styles.button}
							text="Export Wallet Data To Phone"
							onPress={onCreateBackup}
						/>
					</View>
					<SafeAreaInsets type="bottom" />
				</View>
			</AuthCheck>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
	},
	row: {
		flexDirection: 'row',
		marginTop: 16,
		paddingVertical: 10,
		justifyContent: 'space-between',
		display: 'flex',
	},
	text: {
		flex: 1,
	},
	text2: {
		textAlign: 'center',
	},
	title: {
		fontWeight: 'bold',
		fontSize: 16,
	},
	textInput: {
		minHeight: 50,
		borderRadius: 5,
		fontWeight: 'bold',
		fontSize: 18,
		textAlign: 'left',
		color: 'gray',
		borderBottomWidth: 1,
		borderColor: 'gray',
		paddingHorizontal: 10,
		backgroundColor: 'white',
		marginVertical: 5,
	},
	imageContainer: {
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 230,
		height: 230,
	},
	glow: {
		position: 'absolute',
	},
	buttonContainer: {
		marginTop: 'auto',
		marginBottom: 16,
	},
	button: {},
});

export default memo(ExportToPhone);
