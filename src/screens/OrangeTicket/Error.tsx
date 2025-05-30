import React, { ReactElement, memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import type { OrangeTicketScreenProps } from '../../navigation/types';
import { useSheetRef } from '../../sheets/SheetRefsProvider';
import { BodyM } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const getText = (errorCode: number): { title: string; text: string } => {
	switch (errorCode) {
		case 5002:
			return {
				title: 'Card Not Found',
				text: 'This Bitkit card was not found. Please contact support.',
			};
		case 5005:
			return {
				title: 'Other Card',
				text: 'You have already used a different Bitkit card, and those funds have been paid out to your wallet. You can only use one card.',
			};
		default:
			return {
				title: 'Card Error',
				text: "Bitkit couldn't claim the funds. Please try again later or visit us at our booth.",
			};
	}
};

const ErrorScreen = ({
	route,
}: OrangeTicketScreenProps<'Error'>): ReactElement => {
	const { errorCode } = route.params;
	const { title, text } = getText(errorCode);
	const sheetRef = useSheetRef('orangeTicket');

	const onContinue = (): void => {
		sheetRef.current?.close();
	};

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader title={title} />

			<View style={styles.content}>
				<BodyM color="secondary">{text}</BodyM>

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={imageSrc} />
				</View>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						size="large"
						text="OK"
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</GradientView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	imageContainer: {
		flexShrink: 1,
		justifyContent: 'center',
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
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default memo(ErrorScreen);
