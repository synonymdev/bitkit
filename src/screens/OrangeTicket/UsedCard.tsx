import React, { ReactElement, memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import AmountToggle from '../../components/AmountToggle';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import type { OrangeTicketScreenProps } from '../../navigation/types';
import { useSheetRef } from '../../sheets/SheetRefsProvider';
import { BodyM } from '../../styles/text';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const UsedCard = ({
	route,
}: OrangeTicketScreenProps<'UsedCard'>): ReactElement => {
	const { amount } = route.params;
	const sheetRef = useSheetRef('orangeTicket');

	const onContinue = (): void => {
		sheetRef.current?.close();
	};

	return (
		<GradientView style={styles.root}>
			<BottomSheetNavigationHeader title="Used Card" />

			<View style={styles.content}>
				<AmountToggle amount={amount} />

				<BodyM style={styles.text} color="secondary">
					This Bitkit card has already been used, and the funds have been paid
					out.
				</BodyM>

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
	text: {
		marginTop: 32,
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

export default memo(UsedCard);
