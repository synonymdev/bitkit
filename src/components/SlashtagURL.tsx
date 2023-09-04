import React, { ReactElement, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { parse } from '@synonymdev/slashtags-url';
import { TouchableOpacity } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { Caption13S, Text01M, Text02M } from '../styles/text';
import { IThemeColors } from '../styles/themes';
import { ellipsis } from '../utils/helpers';

const SlashtagURL = ({
	url,
	style,
	color = 'brand',
	size = 'medium',
	onPress,
}: {
	url: string;
	style?: StyleProp<ViewStyle>;
	color?: keyof IThemeColors;
	size?: 'small' | 'medium' | 'large';
	onPress?: () => void;
}): ReactElement => {
	const { id, path } = parse(url);

	const Text = useMemo(() => {
		switch (size) {
			case 'large':
				return Text01M;
			case 'medium':
				return Text02M;
			case 'small':
				return Caption13S;
		}
	}, [size]);

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
				@{ellipsis(id, 10)}
				{path}
			</Text>
		</TouchableOpacity>
	);
};

export default SlashtagURL;
