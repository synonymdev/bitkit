// TODO: screen currently unused

import React, { memo, ReactElement, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import Button from '../../../components/buttons/Button';
import { useAppDispatch } from '../../../hooks/redux';
import type { SendScreenProps } from '../../../navigation/types';
import { closeSheet } from '../../../store/slices/ui';
import { BodyM } from '../../../styles/text';

const imageSrc = require('../../../assets/illustrations/transfer.png');

const AutoRebalance = ({
	navigation,
}: SendScreenProps<'AutoRebalance'>): ReactElement => {
	const insets = useSafeAreaInsets();
	const dispatch = useAppDispatch();

	const buttonContainer = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const onCancel = (): void => {
		navigation.goBack();
	};

	const onContinue = (): void => {
		dispatch(closeSheet('sendNavigation'));
	};

	// TODO: get rebalance fee
	const cost = 0.42;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Auto Rebalance?" />

			<BodyM color="secondary" style={styles.text}>
				You don’t have enough instant spending balance for this transaction.
				Would you like Bitkit to rebalance automatically?
			</BodyM>

			<View style={styles.imageContainer}>
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={buttonContainer}>
				<Button
					style={styles.button1}
					variant="secondary"
					size="large"
					text="No, Cancel"
					onPress={onCancel}
				/>
				<Button
					style={styles.button2}
					size="large"
					text={`Yes (Cost: $${cost})`}
					onPress={onContinue}
				/>
			</View>
		</GradientView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	text: {
		paddingHorizontal: 32,
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
		paddingHorizontal: 16,
		marginTop: 'auto',
		gap: 16,
	},
	button1: {
		flex: 1,
	},
	button2: {
		flex: 2,
	},
});

export default memo(AutoRebalance);
