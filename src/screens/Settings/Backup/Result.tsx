import React, { memo, ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text01S } from '../../../styles/text';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { verifyBackup } from '../../../store/actions/user';
import { BackupScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/check.png');

const Result = ({ navigation }: BackupScreenProps<'Result'>): ReactElement => {
	const { t } = useTranslation('security');

	const handleButtonPress = (): void => {
		verifyBackup();
		navigation.navigate('Warning');
	};

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title={t('mnemonic_result_header')} />

			<Text01S color="gray1" style={styles.text}>
				{t('mnemonic_result_text')}
			</Text01S>

			<GlowImage image={imageSrc} imageSize={200} glowColor="green" />

			<View style={styles.buttonContainer}>
				<Button
					size="large"
					text={t('ok')}
					onPress={handleButtonPress}
					testID="OK"
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
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
	},
});

export default memo(Result);
