import React, { ReactElement, memo, useMemo, useCallback } from 'react';
import { StyleSheet, View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { Caption13Up, View as ThemedView } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import { useTransactionDetails } from '../../../hooks/transaction';
import { toggleView } from '../../../store/actions/user';
import FeeCustomToggle from './FeeCustomToggle';
import FeeNumberPad from './FeeNumberPad';

const FeeRate = ({ navigation }): ReactElement => {
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const transaction = useTransactionDetails();

	useFocusEffect(
		useCallback(() => {
			Keyboard.dismiss();
			toggleView({
				view: 'numberPadFee',
				data: {
					isOpen: true,
					snapPoint: 0,
				},
			});
			return (): void => {
				toggleView({
					view: 'numberPadFee',
					data: {
						isOpen: false,
					},
				});
			};
		}, []),
	);

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<BottomSheetNavigationHeader
				title="Set Custom Fee"
				displayBackButton={transaction.satsPerByte !== 0}
			/>
			<View style={styles.content}>
				<Caption13Up color="gray1" style={styles.title}>
					SAT / VBYTE
				</Caption13Up>
				<FeeCustomToggle />

				<View style={nextButtonContainer}>
					<Button
						size="large"
						text="Done"
						disabled={transaction.satsPerByte === 0}
						onPress={(): void => navigation.navigate('ReviewAndSend')}
					/>
				</View>
			</View>
			<FeeNumberPad />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	title: {
		marginBottom: 16,
	},
	nextButtonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 16,
	},
});

export default memo(FeeRate);
