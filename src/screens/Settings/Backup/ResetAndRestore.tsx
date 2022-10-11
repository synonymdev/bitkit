import React, { memo, ReactElement, useState } from 'react';
import { StyleSheet, Image } from 'react-native';

import { View, Text01S } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import Dialog from '../../../components/Dialog';
import Button from '../../../components/Button';
import SafeAreaView from '../../../components/SafeAreaView';
import Glow from '../../../components/Glow';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import type { SettingsScreenProps } from '../../../navigation/types';
import { wipeApp } from '../../../store/actions/settings';
import { toggleView } from '../../../store/actions/user';

const imageSrc = require('../../../assets/illustrations/restore.png');

const ResetAndRestore = ({
	navigation,
}: SettingsScreenProps<'ResetAndRestore'>): ReactElement => {
	const [showDialog, setShowDialog] = useState(false);

	return (
		<SafeAreaView>
			<NavigationHeader
				title="Reset And Restore"
				onClosePress={(): void => {
					navigation.navigate('Tabs');
				}}
			/>
			<View style={styles.container}>
				<Text01S color="gray1">
					Back up your wallet first to avoid loss of your funds and wallet data.
					Resetting will overwrite your current Bitkit setup.
				</Text01S>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="brand" />
					<Image source={imageSrc} style={styles.image} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						variant="secondary"
						style={styles.button}
						text="Back Up First"
						onPress={(): void => {
							toggleView({
								view: 'backupNavigation',
								data: { isOpen: true },
							});
						}}
					/>
					<View style={styles.divider} />
					<Button
						size="large"
						style={styles.button}
						text="Reset Wallet"
						onPress={(): void => setShowDialog(true)}
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</View>

			<Dialog
				visible={showDialog}
				title="Reset Bitkit?"
				description="Are you sure you want to reset your Bitkit Wallet? Do you have a backup of your recovery phrase and wallet data?"
				onCancel={(): void => setShowDialog(false)}
				onConfirm={(): void => {
					wipeApp({});
					setShowDialog(false);
				}}
			/>
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
		flexDirection: 'row',
		justifyContent: 'center',
	},
	button: {
		flex: 1,
	},
	divider: {
		width: 16,
	},
});

export default memo(ResetAndRestore);
