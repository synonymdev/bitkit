import React, { ReactElement } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { Trans, useTranslation } from 'react-i18next';

import NavigationHeader from '../../components/NavigationHeader';
import Button from '../../components/Button';
import { Display, Text01S } from '../../styles/text';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInset from '../../components/SafeAreaInset';
import { setOnboardedContacts } from '../../store/actions/slashtags';
import { RootStackParamList } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/book.png');

type ContactsOnboardingProps = StackScreenProps<RootStackParamList, 'Contacts'>;

const ContactsOnboarding = ({
	navigation,
}: ContactsOnboardingProps): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('contacts')}
				displayBackButton={false}
				onClosePress={(): void => {
					navigation.navigate('Wallet');
				}}
			/>
			<View style={styles.content}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>
				<View style={styles.text}>
					<Display>
						<Trans
							t={t}
							i18nKey="onboarding_header"
							components={{
								brand: <Display color="brand" />,
							}}
						/>
					</Display>
					<Text01S color="gray1" style={styles.introText}>
						{t('onboarding_text')}
					</Text01S>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('onboarding_button')}
						size="large"
						onPress={(): void => {
							setOnboardedContacts();
						}}
						testID="ContactsOnboardingButton"
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		marginHorizontal: 32,
	},
	imageContainer: {
		flex: 1,
		alignItems: 'center',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	introText: {
		marginTop: 8,
	},
	text: {
		flex: 1,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default ContactsOnboarding;
