import React, { ReactElement, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

import { Display, Text01B, Text01S, Text02B } from '../../styles/text';
import GlowingBackground from '../../components/GlowingBackground';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Button from '../../components/Button';
import CheckButton from '../../components/CheckButton';
import { openURL } from '../../utils/helpers';
import type { OnboardingStackScreenProps } from '../../navigation/types';

import termsOfUseText from '../../assets/tos';
import { wipeApp } from '../../store/actions/settings';

const TermsOfUse = ({
	navigation,
}: OnboardingStackScreenProps<'TermsOfUse'>): ReactElement => {
	const [termsOfUse, setTermsOfUse] = useState(false);
	const [privacyPolicy, setPrivacyPolicy] = useState(false);
	const [loading, setLoading] = useState(false);

	const onPress = async (): Promise<void> => {
		setLoading(true);
		// Ensure the app is sufficiently wiped of data from any previous install.
		const wipeAppRes = await wipeApp({
			selectedWallet: 'wallet0',
			showNotification: false,
			restartApp: false,
		});
		setLoading(false);
		if (wipeAppRes.isErr()) {
			return;
		}
		navigation.navigate('Welcome');
	};

	const isValid = termsOfUse && privacyPolicy && !loading;

	return (
		<GlowingBackground topLeft="brand">
			<SafeAreaInsets type="top" />
			<View style={styles.content}>
				<ScrollView style={styles.tos}>
					<Display>Bitkit</Display>
					<Display color="brand">Terms</Display>
					<Display color="brand">of Use.</Display>

					<Text01S color="gray1" style={styles.text}>
						{termsOfUseText}
					</Text01S>
				</ScrollView>

				<View style={styles.checkboxes}>
					<CheckButton
						label={<Text01B>Terms of use</Text01B>}
						description={
							<Text02B color="gray1">
								I declare that I have read and accept the{' '}
								<Text02B
									color="brand"
									onPress={(): void => {
										openURL('https://bitkit.to/terms-of-use');
									}}>
									terms of use.
								</Text02B>
							</Text02B>
						}
						checked={termsOfUse}
						onPress={(): void => setTermsOfUse((prevState) => !prevState)}
						testID="Check1"
					/>
					<CheckButton
						label={<Text01B>Privacy Policy</Text01B>}
						description={
							<Text02B color="gray1">
								I declare that I have read and accept the{' '}
								<Text02B
									color="brand"
									onPress={(): void => {
										openURL('https://bitkit.to/privacy-policy');
									}}>
									privacy policy.
								</Text02B>
							</Text02B>
						}
						checked={privacyPolicy}
						onPress={(): void => setPrivacyPolicy((prevState) => !prevState)}
						testID="Check2"
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						text="Continue"
						size="large"
						disabled={!isValid}
						onPress={onPress}
						testID="Continue"
					/>
				</View>
			</View>
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
	tos: {
		flex: 1,
	},
	text: {
		marginTop: 8,
	},
	checkboxes: {
		paddingTop: 16,
		marginTop: 'auto',
	},
	buttonContainer: {
		marginTop: 24,
	},
});

export default TermsOfUse;
