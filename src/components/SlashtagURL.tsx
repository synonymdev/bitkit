import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Text } from '../styles/components';
import { TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SlashURL } from '@synonymdev/slashtags-sdk/dist/rn.js';

export const SlashtagURL = ({
	url,
	style,
	color = 'brand',
}: {
	url?: string;
	style?: ViewStyle;
	color?: string;
}): JSX.Element => {
	// Ensure that URL is normalized
	const id = url && new SlashURL(url).slashtag.base32;

	return (
		<TouchableOpacity
			onLongPress={(): void => {
				if (url) {
					Clipboard.setString(url);
					console.debug('Copied slashtag url:', url);
				}
			}}
			style={StyleSheet.compose(style, styles.button)}
			activeOpacity={0.8}
			delayLongPress={500}>
			<Text style={styles.at} color={color}>
				@
			</Text>
			<Text style={styles.url} color={color}>
				{id?.slice(0, 5)}...{url?.slice(url.length - 6)}
			</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
	},
	url: {
		fontSize: 15,
		fontWeight: '800',
	},
	at: {
		fontSize: 15,
		opacity: 0.7,
	},
});
