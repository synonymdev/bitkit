import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { SlashURL } from '@synonymdev/slashtags-sdk';
import { TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { Caption13S, Text02M } from '../styles/components';

export const SlashtagURL = ({
	url,
	style,
	color = 'brand',
	bold = true,
	onPress,
}: {
	url: string;
	style?: StyleProp<ViewStyle>;
	color?: string;
	bold?: boolean;
	onPress?: () => void;
}): JSX.Element => {
	const id = SlashURL.parse(url).id;
	const Text = bold ? Text02M : Caption13S;

	return (
		<TouchableOpacity
			style={style}
			activeOpacity={0.8}
			delayLongPress={500}
			onPress={onPress}
			onLongPress={(): void => {
				if (url) {
					Clipboard.setString(url);
					console.debug('Copied slashtag url:', url);
				}
			}}>
			<Text color={color}>
				@{id?.slice(0, 5)}...{url?.slice(url.length - 6)}
			</Text>
		</TouchableOpacity>
	);
};
