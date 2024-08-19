import React, { ReactElement, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, BodyMSB, BodySSB } from '../../styles/text';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import CheckButton from '../../components/buttons/CheckButton';
import VerticalShadow from '../../components/VerticalShadow';
import { openURL } from '../../utils/helpers';
import { wipeKeychain } from '../../utils/keychain';
import TOS from '../../assets/tos';
import type { OnboardingStackScreenProps } from '../../navigation/types';

const TermsOfUse = ({
	navigation,
}: OnboardingStackScreenProps<'TermsOfUse'>): ReactElement => {
	const [termsOfUse, setTermsOfUse] = useState(false);
	const [privacyPolicy, setPrivacyPolicy] = useState(false);
	const [loading, setLoading] = useState(false);
	const { t } = useTranslation('onboarding');

	const onTerms = (): void => {
		openURL('https://bitkit.to/terms-of-use');
	};

	const onPrivacy = (): void => {
		openURL('https://bitkit.to/privacy-policy');
	};

	const onPress = async (): Promise<void> => {
		if (loading) {
			return;
		}

		setLoading(true);

		try {
			// Ensure keychain data is wiped from any previous install
			await wipeKeychain();
			navigation.navigate('Welcome');
		} catch (e) {
			console.log(e);
		}

		setLoading(false);
	};

	const isValid = termsOfUse && privacyPolicy;

	return (
		<>
			<SafeAreaInset type="top" />
			<View style={styles.content}>
				<View style={styles.scrollViewContainer}>
					<ScrollView style={styles.scrollView} testID="TOS">
						<Trans
							t={t}
							i18nKey="tos_header"
							parent={Display}
							components={{ accent: <Display color="brand" /> }}
						/>

						<TOS />
					</ScrollView>

					<View style={styles.shadowContainer}>
						<VerticalShadow direction="bottom" />
					</View>
				</View>

				<View style={styles.checkboxes}>
					<CheckButton
						label={<BodyMSB>{t('tos_checkbox')}</BodyMSB>}
						description={
							<BodySSB color="secondary">
								<Trans
									t={t}
									i18nKey="tos_checkbox_value"
									components={{
										accent: <BodySSB color="brand" onPress={onTerms} />,
									}}
								/>
							</BodySSB>
						}
						checked={termsOfUse}
						testID="Check1"
						onPress={(): void => setTermsOfUse((prevState) => !prevState)}
					/>
					<CheckButton
						label={<BodyMSB>{t('pp_checkbox')}</BodyMSB>}
						description={
							<BodySSB color="secondary">
								<Trans
									t={t}
									i18nKey="pp_checkbox_value"
									components={{
										accent: <BodySSB color="brand" onPress={onPrivacy} />,
									}}
								/>
							</BodySSB>
						}
						checked={privacyPolicy}
						testID="Check2"
						onPress={(): void => setPrivacyPolicy((prevState) => !prevState)}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						text={t('continue')}
						size="large"
						disabled={!isValid}
						onPress={onPress}
						testID="Continue"
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingHorizontal: 32,
	},
	scrollViewContainer: {
		flex: 1,
		position: 'relative',
	},
	scrollView: {
		flex: 1,
		paddingTop: 48,
	},
	shadowContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 70,
		pointerEvents: 'none',
	},
	checkboxes: {
		marginTop: 'auto',
	},
	buttonContainer: {
		marginTop: 24,
	},
});

export default TermsOfUse;
