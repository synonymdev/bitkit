import React, { ReactElement, memo, useState, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

import Flag from '../../components/Flag';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import { useScreenSize } from '../../hooks/screen';
import type { OnboardingStackScreenProps } from '../../navigation/types';
import {
	ScrollView,
	TextInput,
	View as ThemedView,
} from '../../styles/components';
import { BodyM, Display } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/padlock2.png');

const Passphrase = ({
	navigation,
}: OnboardingStackScreenProps<'Passphrase'>): ReactElement => {
	const { t } = useTranslation('onboarding');
	const dimensions = useWindowDimensions();
	const { isSmallScreen } = useScreenSize();
	const [bip39Passphrase, setPassphrase] = useState<string>('');

	const imageStyles = useMemo(
		() => ({
			...styles.image,
			width: dimensions.width * (isSmallScreen ? 0.6 : 0.79),
			height: dimensions.width * (isSmallScreen ? 0.6 : 0.79),
			...(isSmallScreen ? { marginTop: -30 } : {}),
		}),
		[dimensions.width, isSmallScreen],
	);

	return (
		<ThemedView style={styles.root}>
			<KeyboardAvoidingView style={styles.content}>
				<ScrollView
					color="transparent"
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					bounces={false}>
					<SafeAreaInset type="top" />
					<View style={styles.navigationContainer}>
						<NavigationHeader showCloseButton={false} />
						<Flag text={t('advanced')} style={styles.flag} />
					</View>
					<View style={styles.imageContainer}>
						<Image style={imageStyles} source={imageSrc} />
					</View>
					<View style={styles.textContent}>
						<Trans
							t={t}
							i18nKey="passphrase_header"
							parent={Display}
							components={{ accent: <Display color="brand" /> }}
						/>

						<BodyM color="secondary" style={styles.text}>
							{t('passphrase_text')}
						</BodyM>

						<TextInput
							style={styles.input}
							value={bip39Passphrase}
							onChangeText={setPassphrase}
							returnKeyType="done"
							autoCapitalize="none"
							// @ts-ignore autoCompleteType -> autoComplete in newer version
							autoCompleteType="off"
							autoCorrect={false}
							placeholder={t('passphrase')}
							testID="PassphraseInput"
						/>
					</View>

					<View style={styles.buttonContainer}>
						<Button
							style={styles.button}
							text={t('create_new_wallet')}
							size="large"
							testID="CreateNewWallet"
							onPress={(): void => {
								navigation.navigate('Slideshow', { bip39Passphrase });
							}}
						/>
					</View>
				</ScrollView>
				<SafeAreaInset type="bottom" minPadding={16} />
			</KeyboardAvoidingView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
	},
	scrollContent: {
		flex: 1,
		flexGrow: 1,
	},
	navigationContainer: {
		position: 'relative',
	},
	flag: {
		position: 'absolute',
		top: 12,
		right: 0,
	},
	imageContainer: {
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: 'auto',
		marginBottom: 32,
	},
	image: {
		resizeMode: 'contain',
	},
	textContent: {
		paddingHorizontal: 32,
	},
	text: {
		marginTop: 4,
	},
	input: {
		marginTop: 32,
		marginBottom: 28,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingHorizontal: 32,
	},
	button: {
		flex: 1,
	},
});

export default memo(Passphrase);
