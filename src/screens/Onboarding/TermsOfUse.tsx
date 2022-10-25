import React, { ReactElement, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import {
	Caption13Up,
	Display,
	Text01B,
	Text01S,
	Text02B,
} from '../../styles/components';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import CheckButton from '../../components/CheckButton';
import BitkitLogo from '../../assets/bitkit-logo.svg';
import useColors from '../../hooks/colors';
import type { OnboardingStackScreenProps } from '../../navigation/types';
import { openURL } from '../../utils/helpers';

const TermsOfUse = ({
	navigation,
}: OnboardingStackScreenProps<'TermsOfUse'>): ReactElement => {
	const colors = useColors();
	const [termsOfUse, setTermsOfUse] = useState(false);
	const [privacyPolicy, setPrivacyPolicy] = useState(false);
	const onPress = (): void => navigation.navigate('Welcome');

	const isValid = termsOfUse && privacyPolicy;

	return (
		<GlowingBackground topLeft={colors.brand}>
			<SafeAreaInsets type="top" />
			<ScrollView>
				<View style={styles.content}>
					<Display>Bitkit</Display>
					<Display color="brand">Terms</Display>
					<Display color="brand">of Use.</Display>

					{/* TODO: update copy */}
					<Text01S color="gray1" style={styles.text}>
						The following Terms of Use (the "ToU") form a binding agreement
						between you and Synonym (together with our affiliates, collectively
						referred to herein as "Bitkit", "us", "we", "our"), that governs
						your use of our services provided through the application Bitkit
						Wallet ("Wallet") and the website synonym.to ("Website"), other
						mobile apps, and other online areas owned or operated by us
						("Services").{'\n\n'}The terms "you" and "customer" refer to the
						person accessing or using the Services, or the entity or
						organization on whose behalf such person accesses our Services...
						etc
					</Text01S>

					<View style={styles.checkboxes}>
						<Caption13Up style={styles.caption}>
							Acknowledgements (tap to accept)
						</Caption13Up>
						<CheckButton
							label={<Text01B>Terms of use</Text01B>}
							description={
								<Text02B color="gray1">
									I declare that I have read and accept theterms of use.
								</Text02B>
							}
							checked={termsOfUse}
							onPress={(): void => setTermsOfUse((prevState) => !prevState)}
						/>
						<CheckButton
							label={<Text01B>Privacy Policy</Text01B>}
							description={
								<Text02B color="gray1">
									I declare that I have read and accept the{' '}
									<Text02B
										color="brand"
										onPress={(): void => {
											/* TODO: update link */
											openURL('https://synonym.to/terms-of-use/');
										}}>
										privacy policy.
									</Text02B>
								</Text02B>
							}
							checked={privacyPolicy}
							onPress={(): void => setPrivacyPolicy((prevState) => !prevState)}
						/>
					</View>

					<View style={styles.buttonContainer}>
						<Button
							text="Continue"
							size="large"
							disabled={!isValid}
							onPress={onPress}
						/>
					</View>

					<View style={styles.logoContainer}>
						<BitkitLogo height={30} width={72} />
					</View>
				</View>
			</ScrollView>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	content: {
		flex: 1,
		paddingTop: 48,
		paddingBottom: 16,
		paddingHorizontal: 48,
	},
	text: {
		marginTop: 8,
	},
	checkboxes: {
		marginTop: 48,
	},
	caption: {
		marginBottom: 32,
	},
	buttonContainer: {
		marginTop: 32,
		marginBottom: 50,
	},
	logoContainer: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'center',
	},
});

export default TermsOfUse;
