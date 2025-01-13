import React, { ReactElement, memo } from 'react';
import { StyleSheet, View } from 'react-native';

import BitkitLogo from '../../assets/bitkit-logo.svg';
import GradientView from '../../components/GradientView';
import SafeAreaInset from '../../components/SafeAreaInset';
import { BodyMSB, Caption, CaptionB } from '../../styles/text';
import Title from './Title';

const imageSrc = require('../../assets/treasure-hunt/error.jpg');

const ErrorScreen = (): ReactElement => (
	<GradientView style={styles.container} image={imageSrc}>
		<View style={styles.logo} pointerEvents="none">
			<BitkitLogo height={32} width={90} />
		</View>
		<Title text="Lost At Sea" />
		<View style={styles.content}>
			<BodyMSB style={styles.description} color="yellow">
				Arrr! A pirate intercepts your communications and you lose your way.
			</BodyMSB>
			<View style={styles.note}>
				<Caption style={styles.noteText} color="brand">
					<CaptionB color="brand">Something went wrong.</CaptionB>
					{'\n'}Please go to the Synonym booth for support.
				</Caption>
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

export default memo(ErrorScreen);
