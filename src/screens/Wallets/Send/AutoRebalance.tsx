// TODO: screen currently unused

import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import GradientView from '../../../components/GradientView';
import GlowImage from '../../../components/GlowImage';
import Button from '../../../components/Button';
import { toggleView } from '../../../store/actions/ui';
import { Text01S } from '../../../styles/text';
import type { SendScreenProps } from '../../../navigation/types';

const imageSrc = require('../../../assets/illustrations/transfer.png');

const AutoRebalance = ({
	navigation,
}: SendScreenProps<'AutoRebalance'>): ReactElement => {
	const insets = useSafeAreaInsets();

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
		toggleView({
			view: 'sendNavigation',
			data: { isOpen: false },
		});
	};

	// TODO: get rebalance fee
	const cost = 0.42;

	return (
		<GradientView style={styles.container}>
			<BottomSheetNavigationHeader title="Auto Rebalance?" />

			<Text01S color="gray1" style={styles.text}>
				You don’t have enough instant spending balance for this transaction.
				Would you like Bitkit to rebalance automatically?
			</Text01S>

			<GlowImage image={imageSrc} glowColor="green" />

			<View style={buttonContainer}>
				<Button
					style={styles.button1}
					variant="secondary"
					size="large"
					text="No, Cancel"
					onPress={onCancel}
				/>
				<View style={styles.divider} />
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
	buttonContainer: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		marginTop: 'auto',
	},
	button1: {
		flex: 1,
	},
	button2: {
		flex: 2,
	},
	divider: {
		width: 16,
	},
});

export default memo(AutoRebalance);
