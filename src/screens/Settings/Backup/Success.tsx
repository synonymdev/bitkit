import React, { memo, ReactElement } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { BodyMB, BodyM } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/Button';
import { useAppDispatch } from '../../../hooks/redux';
import { verifyBackup } from '../../../store/slices/user';
import { BackupScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const Success = ({
	navigation,
}: BackupScreenProps<'Success'>): ReactElement => {
	const { t } = useTranslation('security');
	const dispatch = useAppDispatch();

	const handleButtonPress = (): void => {
		dispatch(verifyBackup());
		navigation.navigate('Warning');
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('mnemonic_result_header')} />

			<BodyM style={styles.text} color="secondary">
				<Trans
					t={t}
					i18nKey="mnemonic_result_text"
					components={{ accent: <BodyMB color="white" /> }}
				/>
			</BodyM>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={styles.buttonContainer}>
				<Button
					size="large"
					text={t('ok')}
					testID="OK"
					onPress={handleButtonPress}
				/>
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
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
	},
});

export default memo(Success);
