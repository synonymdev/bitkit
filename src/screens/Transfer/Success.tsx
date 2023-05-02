import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, Text01B, Text01S } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/transfer.png');

const Success = ({
	navigation,
	route,
}: TransferScreenProps<'Success'>): ReactElement => {
	const { t } = useTranslation('lightning');
	const { type } = route.params;

	const onContinue = (): void => {
		navigation.popToTop();
		navigation.goBack();
	};

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer_successful')}
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<Display color="purple">
					{t(type === 'savings' ? 'ts_savings_title' : 'ts_spendings_title')}
				</Display>
				<Text01S color="gray1" style={styles.text}>
					<Trans
						t={t}
						i18nKey={
							type === 'savings' ? 'ts_savings_text' : 'ts_spendings_text'
						}
						components={{
							purple: <Text01B color="purple" />,
						}}
					/>
				</Text01S>

				<GlowImage image={imageSrc} glowColor="purple" />

				<View style={styles.buttonContainer}>
					<Button text={t('ok')} size="large" onPress={onContinue} />
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
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default memo(Success);
