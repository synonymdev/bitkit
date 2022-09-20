import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView, Text01S } from '../../../styles/components';
import BottomSheetNavigationHeader from '../../../components/BottomSheetNavigationHeader';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleView } from '../../../store/actions/user';

const imageSrc = require('../../../assets/illustrations/light-bulb.png');

const Result = (): ReactElement => {
	const insets = useSafeAreaInsets();
	const buttonContainerStyles = useMemo(
		() => ({
			...styles.buttonContainer,
			paddingBottom: insets.bottom + 16,
		}),
		[insets.bottom],
	);

	const handleButtonPress = (): void => {
		toggleView({
			view: 'backupNavigation',
			data: { isOpen: false },
		});
	};

	return (
		<ThemedView color="onSurface" style={styles.container}>
			<BottomSheetNavigationHeader
				title="Wallet Metadata"
				displayBackButton={false}
			/>

			<Text01S color="gray1" style={styles.text}>
				Transactions, accounts, contacts and tags will be backed up
				automagically. You can export data from the settings.
			</Text01S>

			<View style={styles.imageContainer}>
				<Glow style={styles.glow} size={300} color="yellow" />
				<Image source={imageSrc} style={styles.image} />
			</View>

			<View style={buttonContainerStyles}>
				<Button size="large" text="OK" onPress={handleButtonPress} />
			</View>
		</ThemedView>
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
		flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		width: 200,
		height: 200,
	},
	glow: {
		position: 'absolute',
	},
	buttonContainer: {
		marginTop: 'auto',
		paddingHorizontal: 32,
		width: '100%',
	},
});

export default memo(Result);
