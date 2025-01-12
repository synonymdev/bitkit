import React, { ReactElement } from 'react';
import { View, Image, ImageSourcePropType, StyleSheet } from 'react-native';

import { Display, BodyM, Title } from '../styles/text';
import { View as ThemedView } from '../styles/components';
import SafeAreaInset from './SafeAreaInset';
import Button from './buttons/Button';
import NavigationHeader from './NavigationHeader';

const OnboardingScreen = ({
	navTitle,
	title,
	description,
	image,
	imagePosition,
	buttonText,
	showBackButton = true,
	showCloseButton = true,
	disableNav = false,
	mirrorImage = false,
	testID,
	onButtonPress,
}: {
	navTitle?: string;
	title: string | ReactElement;
	description: string | ReactElement;
	image: ImageSourcePropType;
	imagePosition?: 'center' | 'bottom';
	buttonText: string;
	showBackButton?: boolean;
	showCloseButton?: boolean;
	disableNav?: boolean;
	mirrorImage?: boolean;
	testID?: string;
	onButtonPress: () => void;
}): ReactElement => {
	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			{disableNav ? (
				<Title style={styles.header}>{navTitle}</Title>
			) : (
				<NavigationHeader
					title={navTitle}
					showBackButton={showBackButton}
					showCloseButton={showCloseButton}
				/>
			)}

			<View style={styles.content} testID={testID}>
				<View
					style={[
						styles.imageContainer,
						{ marginBottom: imagePosition === 'center' ? 'auto' : 48 },
						mirrorImage ? { transform: [{ rotateY: '180deg' }] } : {},
					]}>
					<Image style={styles.image} source={image} />
				</View>

				<Display>{title}</Display>
				<BodyM style={styles.description} color="secondary">
					{description}
				</BodyM>

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
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	header: {
		textAlign: 'center',
		paddingBottom: 35,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: '100%',
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	description: {
		marginTop: 4,
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 32,
	},
	button: {
		flex: 1,
	},
});

export default OnboardingScreen;
