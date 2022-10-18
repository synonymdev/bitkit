import React, { memo, ReactElement, useEffect, useState } from 'react';
import { StyleSheet, Image } from 'react-native';
import { useSelector } from 'react-redux';
import Share from 'react-native-share';

import { View, Text01S } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Store from '../../../store/types';
import {
	showErrorNotification,
	showSuccessNotification,
} from '../../../utils/notifications';
import {
	cleanupBackupFiles,
	createBackupFile,
} from '../../../utils/backup/fileBackup';
import SafeAreaView from '../../../components/SafeAreaView';
import Glow from '../../../components/Glow';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import type { SettingsScreenProps } from '../../../navigation/types';
import { getKeychainValue } from '../../../utils/helpers';

const imageSrc = require('../../../assets/illustrations/folder.png');

const ExportToPhone = ({
	navigation,
}: SettingsScreenProps<'ExportToPhone'>): ReactElement => {
	const pinEnabled = useSelector((state: Store) => state.settings.pin);
	const [isCreating, setIsCreating] = useState<boolean>(false);

	useEffect(() => {
		return (): void => {
			cleanupBackupFiles().catch();
		};
	}, []);

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
		setIsCreating(true);

		const { data: pin } = await getKeychainValue({ key: 'pin' });
		const fileRes = await createBackupFile(pinEnabled ? pin : undefined);

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
			<View style={styles.container}>
				<Text01S color="gray1">
					If you want, you can export a copy of all metadata to your phone. Be
					aware, this .zip file will be encrypted with your PIN code if you have
					set up a PIN code for Bitkit.
				</Text01S>

				<View style={styles.imageContainer} pointerEvents="none">
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
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 16,
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
