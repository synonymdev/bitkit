import React, { ReactElement } from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Display, Text01S } from '../styles/text';
import GlowingBackground from './GlowingBackground';
import SafeAreaInset from './SafeAreaInset';
import Button from './Button';
import { IColors } from '../styles/colors';

const IntroScreen = ({
	accentColor,
	title,
	description,
	image,
	buttonText,
	testID,
	onButtonPress,
}: {
	accentColor: keyof IColors;
	title: string;
	description: string;
	image: ImageSourcePropType;
	buttonText: string;
	testID?: string;
	onButtonPress: () => void;
}): ReactElement => {
	const { t } = useTranslation();

	return (
		<GlowingBackground topLeft={accentColor}>
			<SafeAreaInset type="top" />
			<View style={styles.content} testID={testID}>
				<View style={styles.imageContainer}>
					<Image style={styles.image} source={image} />
				</View>
				<View style={styles.text}>
					<Display>
						<Trans
							t={t}
							i18nKey={title}
							components={{ highlight: <Display color={accentColor} /> }}
						/>
					</Display>
					<Text01S style={styles.description} color="gray1">
						{description}
					</Text01S>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={buttonText}
						size="large"
						testID={`${testID}-button`}
						onPress={onButtonPress}
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
		flex: 3.2,
		alignItems: 'center',
		paddingVertical: 50,
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	text: {
		flex: 3,
		paddingHorizontal: 4,
	},
	description: {
		marginTop: 4,
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

export default IntroScreen;
