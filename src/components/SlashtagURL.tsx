import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import { TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { Text } from '../styles/components';

export const SlashtagURL = ({
	url,
	style,
	color = 'brand',
	onPress,
}: {
	url?: string;
	style?: ViewStyle;
	color?: string;
	onPress?: () => void;
}): JSX.Element => {
	const id = url && SlashURL.parse(url).id;

	return (
		<TouchableOpacity
			onPress={onPress}
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
