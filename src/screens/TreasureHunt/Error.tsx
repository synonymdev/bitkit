import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Caption13M, Caption13S, Text01M } from '../../styles/text';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import Title from './Title';
import BitkitLogo from '../../assets/bitkit-logo.svg';

const imageSrc = require('../../assets/treasure-hunt/error.jpg');

const Error = (): ReactElement => (
	<GradientView style={styles.container} image={imageSrc}>
		<View style={styles.logo} pointerEvents="none">
			<BitkitLogo height={32} width={90} />
		</View>
		<Title text="Lost At Sea" />
		<View style={styles.content}>
			<Text01M style={styles.description} color="yellow">
				Arrr! A pirate intercepts your communications and you lose your way.
			</Text01M>
			<View style={styles.note}>
				<Caption13S style={styles.noteText} color="brand">
					<Caption13M color="brand">Something went wrong.</Caption13M>
					{'\n'}Please go to the Synonym booth for support.
				</Caption13S>
			</View>
		</View>
		<SafeAreaInset type="bottom" minPadding={16} />
	</GradientView>
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	logo: {
		flexDirection: 'row',
		justifyContent: 'center',
	},
	content: {
		flex: 1.3,
		paddingHorizontal: 16,
		justifyContent: 'center',
		zIndex: 2,
	},
	description: {
		marginTop: 'auto',
		textAlign: 'center',
	},
	note: {
		marginTop: 80,
	},
	noteText: {
		opacity: 0.6,
		textAlign: 'center',
	},
});

export default memo(Error);
