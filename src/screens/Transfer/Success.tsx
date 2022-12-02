import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Display, Text01B, Text01S } from '../../styles/components';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/transfer.png');

const Success = ({
	navigation,
	route,
}: TransferScreenProps<'Success'>): ReactElement => {
	const { type } = route.params;
	const title =
		type === 'savings'
			? 'Transferring to Savings.'
			: 'Transferring to Spending.';

	const text =
		type === 'savings' ? (
			<>
				Transferring funds from your spending balance to your savings. You will
				be able to use these funds in <Text01B color="purple">±1 hour</Text01B>.
			</>
		) : (
			<>
				Transferring funds from your savings to your spending balance. You will
				be able to use these funds in{' '}
				<Text01B color="purple">±10 minutes</Text01B>.
			</>
		);

	const onContinue = (): void => {
		// TODO: transfer and check for success
		const success = true;

		if (success) {
			navigation.popToTop();
			navigation.goBack();
		} else {
			navigation.navigate('Interrupted');
		}
	};

	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Transfer Successful" displayBackButton={false} />
			<View style={styles.root}>
				<Display color="purple">{title}</Display>
				<Text01S color="gray1" style={styles.text}>
					{text}
				</Text01S>

				<GlowImage image={imageSrc} glowColor="purple" />

				<View style={styles.buttonContainer}>
					<Button text="OK" size="large" onPress={onContinue} />
				</View>
			</View>
			<SafeAreaInsets type="bottom" />
		</GlowingBackground>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 8,
		marginBottom: 16,
	},
	buttonContainer: {
		marginTop: 'auto',
		marginBottom: 16,
	},
});

export default memo(Success);
