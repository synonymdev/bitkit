import React, { ReactElement } from 'react';
import { Image, StyleSheet } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { View } from '../../styles/components';
import { Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import type { OnboardingStackScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/phone.png');

const MultipleDevices = ({
	navigation,
}: OnboardingStackScreenProps<'MultipleDevices'>): ReactElement => {
	const { t } = useTranslation('onboarding');

	return (
		<GlowingBackground topLeft="yellow">
			<View color="transparent" style={styles.slide}>
				<SafeAreaInsets type="top" />
				<NavigationHeader />
				<View color="transparent" style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View color="transparent" style={styles.textContent}>
					<Display>
						<Trans
							t={t}
							i18nKey="multiple_header"
							components={{
								yellow: <Display color="yellow" />,
							}}
						/>
					</Display>
					<Text01S color="gray1" style={styles.text}>
						{t('multiple_text')}
					</Text01S>
				</View>

				<View color="transparent" style={styles.buttonContainer}>
					<Button
						text={t('understood')}
						size="large"
						style={[styles.button, styles.quickButton]}
						onPress={(): void => {
							navigation.navigate('RestoreFromSeed');
						}}
						testID="MultipleButton"
					/>
				</View>
				<SafeAreaInsets type="bottom" />
			</View>
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	slide: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'stretch',
		marginBottom: 16,
	},
	imageContainer: {
		flex: 4,
		alignItems: 'center',
		paddingVertical: 50,
		justifyContent: 'flex-end',
		width: '100%',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	textContent: {
		flex: 3,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginHorizontal: 16,
	},
	button: {
		flex: 1,
	},
	quickButton: {
		marginRight: 6,
	},
});

export default MultipleDevices;
