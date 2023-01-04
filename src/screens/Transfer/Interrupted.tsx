import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Display, Text01S } from '../../styles/text';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import GlowingBackground from '../../components/GlowingBackground';
import NavigationHeader from '../../components/NavigationHeader';
import GlowImage from '../../components/GlowImage';
import Button from '../../components/Button';
import type { TransferScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/exclamation-mark.png');

const Interrupted = ({
	navigation,
}: TransferScreenProps<'Interrupted'>): ReactElement => {
	return (
		<GlowingBackground topLeft="purple">
			<SafeAreaInsets type="top" />
			<NavigationHeader
				title="Transfer Interrupted"
				displayBackButton={false}
			/>
			<View style={styles.root}>
				<Display color="purple">Please keep Bitkit open.</Display>
				<Text01S color="gray1" style={styles.text}>
					Funds were not transferred yet. Bitkit will try to initiate the
					transfer during the next 30 minutes. Please keep your app open.
				</Text01S>

				<GlowImage image={imageSrc} glowColor="purple" />

				<View>
					<Button
						text="OK"
						size="large"
						onPress={(): void => {
							navigation.popToTop();
							navigation.goBack();
						}}
					/>
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
});

export default memo(Interrupted);
