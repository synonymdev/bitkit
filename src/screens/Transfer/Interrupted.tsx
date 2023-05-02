import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Display, Text01S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Interrupted = ({
	navigation,
}: TransferScreenProps<'Interrupted'>): ReactElement => {
	const { t } = useTranslation('lightning');

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('interrupted_title')}
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<Display color="purple">{t('interrupted_header')}</Display>
				<Text01S color="gray1" style={styles.text}>
					{t('interrupted_text')}
				</Text01S>

				<GlowImage image={imageSrc} glowColor="purple" />

				<View>
					<Button
						text={t('ok')}
						size="large"
						onPress={(): void => {
							navigation.popToTop();
							navigation.goBack();
						}}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 16,
	},
});

export default memo(Interrupted);
