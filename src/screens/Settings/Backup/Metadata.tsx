import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { View as ThemedView, Text01S } from '../../../styles/components';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';
import { toggleView } from '../../../store/actions/user';

const Result = (): ReactElement => {
	const insets = useSafeAreaInsets();
	const nextButtonContainer = useMemo(
		() => ({
			...styles.nextButtonContainer,
			paddingBottom: insets.bottom + 10,
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
			<NavigationHeader
				title="Wallet metadata"
				size="sm"
				displayBackButton={false}
			/>

			<Text01S color="gray1" style={styles.text}>
				Transactions, accounts, contacts and tags will be backed up
				automagically. You can export data from the settings.
			</Text01S>

			<View style={styles.imageContainer}>
				<Glow style={styles.glow} size={300} color="yellow" />
				<Image
					source={require('../../../assets/illustrations/light-bulb.png')}
					style={styles.image}
				/>
			</View>

			<View style={nextButtonContainer}>
				<Button size="lg" text="OK" onPress={handleButtonPress} />
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	imageContainer: {
		position: 'relative',
		height: 300,
		width: 300,
		justifyContent: 'center',
		alignItems: 'center',
	},
	text: {
		paddingHorizontal: 32,
	},
	image: {
		width: 200,
		height: 200,
	},
	glow: {
		position: 'absolute',
	},
	nextButtonContainer: {
		width: '100%',
		paddingHorizontal: 32,
		minHeight: 100,
	},
});

export default memo(Result);
