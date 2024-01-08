import React, { ReactElement } from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';

import { Display, Text01S } from '../styles/text';
import GlowingBackground from './GlowingBackground';
import SafeAreaInset from './SafeAreaInset';
import Button from './Button';
import { IColors } from '../styles/colors';
import NavigationHeader from './NavigationHeader';
import GlowImage from './GlowImage';

const InfoScreen = ({
	accentColor,
	navTitle,
	title,
	description,
	image,
	buttonText,
	displayBackButton = true,
	testID,
	onButtonPress,
}: {
	accentColor: keyof IColors;
	navTitle: string;
	title: string;
	description: string | ReactElement;
	image: ImageSourcePropType;
	buttonText: string;
	displayBackButton?: boolean;
	testID?: string;
	onButtonPress: () => void;
}): ReactElement => {
	return (
		<GlowingBackground topLeft={accentColor}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={navTitle}
				displayBackButton={displayBackButton}
			/>
			<View style={styles.content} testID={testID}>
				<Display color={accentColor}>{title}</Display>
				<Text01S style={styles.description} color="gray1">
					{description}
				</Text01S>

				<GlowImage image={image} glowColor="purple" />

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
		marginTop: 8,
		paddingHorizontal: 16,
	},
	description: {
		marginTop: 4,
		marginBottom: 16,
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

export default InfoScreen;
