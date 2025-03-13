import React, { memo, ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet } from 'react-native';

import Dialog from '../../../components/Dialog';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useSheetRef } from '../../../sheets/SheetRefsProvider';
import { wipeApp } from '../../../store/utils/settings';
import { View } from '../../../styles/components';
import { BodyM } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/restore.png');

const ResetAndRestore = (): ReactElement => {
	const { t } = useTranslation('security');
	const sheetRef = useSheetRef('backupNavigation');
	const [showDialog, setShowDialog] = useState(false);

	return (
		<View style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('reset_title')} />
			<View style={styles.container}>
				<BodyM color="secondary">{t('reset_text')}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						size="large"
						variant="secondary"
						style={styles.button}
						text={t('reset_button_backup')}
						onPress={(): void => {
							sheetRef.current?.present();
						}}
					/>
					<Button
						size="large"
						style={styles.button}
						text={t('reset_button_reset')}
						onPress={(): void => setShowDialog(true)}
					/>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>

			<Dialog
				visible={showDialog}
				title={t('reset_dialog_title')}
				description={t('reset_dialog_desc')}
				confirmText={t('reset_confirm')}
				onCancel={(): void => setShowDialog(false)}
				onConfirm={async (): Promise<void> => {
					await wipeApp();
					setShowDialog(false);
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	container: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		aspectRatio: 1,
		marginTop: 'auto',
		width: 256,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ResetAndRestore);
