import React, { ErrorInfo, ReactElement } from 'react';
import {
	View,
	Text,
	StyleSheet,
	StatusBar,
	TouchableOpacity,
	Image,
	Platform,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SafeAreaInset from '../components/SafeAreaInset';
import { openURL } from '../utils/helpers';
import { createSupportLink } from '../utils/support';

const imageSrc = require('../assets/illustrations/cross.png');

type ReactError = Error & ErrorInfo;

const AppError = ({ error }: { error: ReactError }): ReactElement => {
	const onSend = async (): Promise<void> => {
		const message = `Error: ${error.message}
\nComponent Stack: ${error.componentStack}
\nStack: ${error.stack}`;

		const link = await createSupportLink('Bitkit Support [Error]', message);
		const res = await openURL(link);
		if (!res) {
			await openURL('https://synonym.to/contact');
		}
	};

	return (
		<SafeAreaProvider>
			<StatusBar barStyle="light-content" backgroundColor="black" />
			<View style={styles.root}>
				<SafeAreaInset type="top" minPadding={16} />
				<Text style={styles.header}>Unexpected Error</Text>

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

					<View style={styles.imageContainer} pointerEvents="none">
						<Image style={styles.image} source={imageSrc} />
					</View>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[styles.button, styles.buttonPrimary]}
							activeOpacity={0.7}
							testID="ErrorReport"
							onPress={onSend}>
							<Text style={styles.buttonText}>Send Report</Text>
						</TouchableOpacity>
					</View>
				</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
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
		flexShrink: 1,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		width: 256,
		aspectRatio: 1,
		marginTop: 'auto',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 'auto',
		gap: 16,
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
	buttonText: {
		color: 'white',
		fontSize: 15,
		fontWeight: 'bold',
	},
});

export default AppError;
