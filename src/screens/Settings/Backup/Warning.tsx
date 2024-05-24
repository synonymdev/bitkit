import React, { memo, ReactElement } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { BodyM, BodyMB } from '../../../styles/text';
import GradientView from '../../../components/GradientView';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import Button from '../../../components/Button';
import type { BackupScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/exclamation-mark.png');

const Warning = ({
	navigation,
}: BackupScreenProps<'Warning'>): ReactElement => {
	const { t } = useTranslation('security');

	const handleButtonPress = (): void => {
		navigation.navigate('Success');
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('mnemonic_keep_header')} />

			<BodyM style={styles.text} color="secondary">
				<Trans
					t={t}
					i18nKey="mnemonic_keep_text"
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
		width: '100%',
	},
});

export default memo(Warning);
