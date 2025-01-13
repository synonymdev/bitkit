import React, { memo, ReactElement, useState } from 'react';
import {
	Image,
	ImageSourcePropType,
	LayoutChangeEvent,
	StyleSheet,
	View,
} from 'react-native';

import BottomSheetNavigationHeader from '../components/BottomSheetNavigationHeader';
import SafeAreaInset from '../components/SafeAreaInset';
import { BodyM, Display } from '../styles/text';
import Button from './buttons/Button';

const BottomSheetScreen = ({
	navTitle,
	title,
	description,
	image,
	continueText,
	cancelText,
	showBackButton = true,
	isLoading,
	testID,
	onCancel,
	onContinue,
}: {
	navTitle: string;
	title: string | ReactElement;
	description: string | ReactElement;
	image: ImageSourcePropType;
	continueText: string;
	cancelText?: string;
	showBackButton?: boolean;
	isLoading?: boolean;
	testID?: string;
	onCancel?: () => void;
	onContinue: () => void;
}): ReactElement => {
	const [isLarge, setIsLarge] = useState(false);

	const onLayout = (event: LayoutChangeEvent): void => {
		// add margin to the image container if the sheet is large
		if (event.nativeEvent.layout.height > 700) {
			setIsLarge(true);
		}
	};

	return (
		<View style={styles.root} testID={testID} onLayout={onLayout}>
			<BottomSheetNavigationHeader
				title={navTitle}
				showBackButton={showBackButton}
			/>
			<View style={styles.content}>
				<View
					style={[styles.imageContainer, { marginBottom: isLarge ? 32 : 0 }]}>
					<Image style={styles.image} source={image} />
				</View>
				<Display>{title}</Display>
				<BodyM color="secondary">{description}</BodyM>
				<View style={styles.buttonContainer}>
					{cancelText && (
						<Button
							style={styles.button}
							variant="secondary"
							size="large"
							text={cancelText}
							testID={`${testID}-button-cancel`}
							onPress={onCancel}
						/>
					)}
					<Button
						style={styles.button}
						size="large"
						text={continueText}
						loading={isLoading}
						testID={`${testID}-button-continue`}
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 32,
	},
	imageContainer: {
		flexShrink: 1,
		alignItems: 'center',
		alignSelf: 'center',
		width: '80%',
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 32,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(BottomSheetScreen);
