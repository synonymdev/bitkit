import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trans, useTranslation } from 'react-i18next';

import { Text01S, Text02B, Text02S } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { closeBottomSheet } from '../../../store/actions/ui';
import { useSelector } from 'react-redux';
import { backupSelector } from '../../../store/reselect/backup';

const imageSrc = require('../../../assets/illustrations/tag.png');

const Metadata = (): ReactElement => {
	const { t } = useTranslation('security');
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);
	const backup = useSelector(backupSelector);

	const arr = [
		backup.remoteLdkBackupLastSync,
		backup.remoteSettingsBackupLastSync,
		backup.remoteWidgetsBackupLastSync,
		backup.remoteMetadataBackupLastSync,
		backup.remoteLdkActivityBackupLastSync,
		backup.remoteBlocktankBackupLastSync,
	].filter((i) => i !== undefined) as Array<number>;

	const max = Math.max(...arr);

	const handleButtonPress = useCallback((): void => {
		closeBottomSheet('backupNavigation');
	}, []);

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('mnemonic_data_header')} />

			<Text01S color="gray1" style={styles.text}>
				{t('mnemonic_data_text')}
			</Text01S>

			<GlowImage image={imageSrc} imageSize={200} />

			<View style={buttonContainerStyles}>
				{max && (
					<Text02S style={styles.last}>
						<Trans
							t={t}
							i18nKey="mnemonic_latest_backup"
							components={{
								bold: <Text02B />,
							}}
							values={{
								time: t('intl:dateTime', {
									v: new Date(max),
									formatParams: {
										v: {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: 'numeric',
											minute: 'numeric',
										},
									},
								}),
							}}
						/>
					</Text02S>
				)}

				<Button
					size="large"
					text={t('ok')}
					onPress={handleButtonPress}
					testID="OK"
				/>
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		paddingHorizontal: 32,
	},
	last: {
		marginBottom: 16,
	},
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
		width: '100%',
	},
});

export default memo(Metadata);
