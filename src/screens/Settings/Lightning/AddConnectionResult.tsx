import React, { ReactElement, memo } from 'react';
import { StyleSheet, View, Image } from 'react-native';

import { Text01S, View as ThemedView } from '../../../styles/components';
import SafeAreaInsets from '../../../components/SafeAreaInsets';
import NavigationHeader from '../../../components/NavigationHeader';
import Button from '../../../components/Button';
import Glow from '../../../components/Glow';

const AddConnectionResult = ({ navigation }): ReactElement => {
	return (
		<ThemedView style={styles.root}>
			<SafeAreaInsets type="top" />
			<NavigationHeader title="Connection opened" />
			<View style={styles.content}>
				<Text01S color="gray1" style={styles.text}>
					You successfully opened a connection with ‘LNBIG Lightning Node’. It
					might take a while for the connection to become ready for use.
				</Text01S>

				<View style={styles.imageContainer} pointerEvents="none">
					<Glow style={styles.glow} size={600} color="green" />
					<Image
						style={styles.image}
						source={require('../../../assets/illustrations/check.png')}
					/>
				</View>

				<View>
					<Button
						text="OK"
						size="large"
						onPress={(): void => {
							navigation.goBack();
							navigation.goBack();
						}}
					/>
					<SafeAreaInsets type="bottom" />
				</View>
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		justifyContent: 'space-between',
		marginTop: 8,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 16,
		marginBottom: 16,
	},
	imageContainer: {
		height: 300,
		width: 300,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
		alignSelf: 'center',
	},
	glow: {
		position: 'absolute',
	},
	image: {
		height: 200,
		width: 200,
		resizeMode: 'contain',
	},
});

export default memo(AddConnectionResult);
