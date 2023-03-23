import React, { ErrorInfo } from 'react';
import {
	View,
	Text,
	StyleSheet,
	StatusBar,
	TouchableOpacity,
	Image,
	Platform,
} from 'react-native';
import RNExitApp from 'react-native-exit-app';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { Glow } from '../components/Glow';
import { openURL } from '../utils/helpers';
import { createSupportLink } from '../utils/support';

const imageSrc = require('../assets/illustrations/cross.png');

type ReactError = Error & ErrorInfo;

const AppError = ({ error }: { error: ReactError }): JSX.Element => {
	const onClose = async (): Promise<void> => {
		RNExitApp.exitApp();
	};

	const onSend = async (): Promise<void> => {
		const message = `Error: ${error.message}
\nComponent Stack: ${error.componentStack}
\nStack: ${error.stack}`;

		const link = await createSupportLink('Bitkit Support [Error]', message);
		await openURL(link);
	};

	return (
		<SafeAreaProvider>
			<StatusBar barStyle="light-content" backgroundColor="black" />
			<SafeAreaView style={styles.root}>
				<Text style={styles.header}>Unexpected Error</Text>

				<View style={styles.background}>
					<View style={styles.imageContainer} pointerEvents="none">
						<Glow style={styles.glow} color="#E95164" size={600} />
						<Image style={styles.image} source={imageSrc} />
					</View>
				</View>

				<View style={styles.content}>
					<Text style={styles.text}>
						Sorry, Bitkit just crashed unexpectedly. Here is a glimpse of what
						went wrong:
					</Text>

					<View style={styles.error}>
						<Text style={[styles.text, styles.errorText]}>
							{error.message}
							{'\n'}
							{error.componentStack}
						</Text>
					</View>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.buttonSecondary]}
							testID="ErrorClose"
							onPress={onClose}>
							<Text style={styles.buttonText}>Close Bitkit</Text>
						</TouchableOpacity>
						<View style={styles.divider} />
						<TouchableOpacity
							style={[styles.button, styles.buttonPrimary]}
							testID="ErrorReport"
							onPress={onSend}>
							<Text style={styles.buttonText}>Send Report</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		</SafeAreaProvider>
	);
};

const styles = StyleSheet.create({
	root: {
		backgroundColor: 'black',
		flex: 1,
	},
	header: {
		color: 'white',
		fontSize: 22,
		fontWeight: 'bold',
		textAlign: 'center',
		marginTop: 17,
		paddingBottom: 35,
	},
	background: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	text: {
		fontSize: 17,
		lineHeight: 22,
		color: '#8E8E93',
	},
	error: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
		borderRadius: 16,
		marginTop: 16,
		marginBottom: 24,
		padding: 16,
		flex: 1,
		...Platform.select({
			ios: {
				maxHeight: 120,
			},
			android: {
				maxHeight: 115,
			},
		}),
	},
	errorText: {
		color: '#E95164',
	},
	imageContainer: {
		// flex: 1,
		position: 'relative',
		justifyContent: 'center',
		alignItems: 'center',
	},
	image: {
		height: 220,
		resizeMode: 'contain',
	},
	glow: {
		position: 'absolute',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		marginBottom: 16,
	},
	button: {
		borderRadius: 64,
		height: 56,
		minWidth: 110,
		marginTop: 32,
		paddingHorizontal: 23,
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonPrimary: {
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	buttonSecondary: {
		borderColor: 'rgba(255, 255, 255, 0.08)',
		borderWidth: 2,
	},
	buttonText: {
		color: 'white',
		fontSize: 15,
		fontWeight: 'bold',
	},
	divider: {
		width: 16,
	},
});

export default AppError;
