import React, { ReactElement } from 'react';
import { View, Image, ImageSourcePropType, StyleSheet } from 'react-native';

import { Display, BodyM } from '../styles/text';
import { View as ThemedView } from '../styles/components';
import SafeAreaInset from './SafeAreaInset';
import Button from './Button';
import NavigationHeader from './NavigationHeader';

const InfoScreen = ({
	navTitle,
	title,
	description,
	image,
	buttonText,
	displayBackButton = true,
	testID,
	onButtonPress,
}: {
	navTitle: string;
	title: string | ReactElement;
	description: string | ReactElement;
	image: ImageSourcePropType;
	buttonText: string;
	displayBackButton?: boolean;
	testID?: string;
	onButtonPress: () => void;
}): ReactElement => {
	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={navTitle}
				displayBackButton={displayBackButton}
			/>
			<View style={styles.content} testID={testID}>
				<Display>{title}</Display>
				<BodyM style={styles.description} color="secondary">
					{description}
				</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={image} />
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
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
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
		justifyContent: 'center',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default InfoScreen;
