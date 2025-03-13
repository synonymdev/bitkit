import React, { memo, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/buttons/Button';
import { useAppSelector } from '../../../hooks/redux';
import { useSheetRef } from '../../../sheets/SheetRefsProvider';
import { backupSelector } from '../../../store/reselect/backup';
import { EBackupCategory } from '../../../store/types/backup';
import { BodyM, BodyS, BodySB } from '../../../styles/text';
import { i18nTime } from '../../../utils/i18n';

const imageSrc = require('../../../assets/illustrations/card.png');

const Metadata = (): ReactElement => {
	const { t } = useTranslation('security');
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const sheetRef = useSheetRef('backupNavigation');
	const backup = useAppSelector(backupSelector);

	const max = Math.max(
		...Object.values(EBackupCategory).map((key) => {
			return backup[key].synced;
		}),
	);

	const onContinue = (): void => {
		sheetRef.current?.close();
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('mnemonic_data_header')} />

			<BodyM color="secondary" style={styles.text}>
				{t('mnemonic_data_text')}
			</BodyM>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={styles.buttonContainer}>
				{max && (
					<BodyS style={styles.last}>
						<Trans
							t={t}
							i18nKey="mnemonic_latest_backup"
							components={{ bold: <BodySB /> }}
							values={{
								time: tTime('dateTime', {
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
					</BodyS>
				)}
				<Button size="large" text={t('ok')} testID="OK" onPress={onContinue} />
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
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
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
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
