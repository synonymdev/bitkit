import Clipboard from '@react-native-clipboard/clipboard';
import { parse } from '@synonymdev/slashtags-url';
import React, { ReactElement, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { TouchableOpacity } from 'react-native';

import { BodyMSB, BodySSB, Caption } from '../styles/text';
import { IThemeColors } from '../styles/themes';
import { ellipsis } from '../utils/helpers';

const SlashtagURL = ({
	url,
	style,
	color = 'brand',
	size = 'medium',
	onPress,
	testID,
}: {
	url: string;
	style?: StyleProp<ViewStyle>;
	color?: keyof IThemeColors;
	size?: 'small' | 'medium' | 'large';
	onPress?: () => void;
	testID?: string;
}): ReactElement => {
	const { id } = parse(url);

	const Text = useMemo(() => {
		switch (size) {
			case 'large':
				return BodyMSB;
			case 'medium':
				return BodySSB;
			case 'small':
				return Caption;
		}
	}, [size]);

	return (
		<TouchableOpacity
			style={style}
			activeOpacity={0.7}
			delayLongPress={500}
			testID={testID}
			accessibilityLabel={url}
			onPress={onPress}
			onLongPress={(): void => {
				if (url) {
					Clipboard.setString(url);
					console.debug('Copied slashtag url:', url);
				}
			}}>
			<Text color={color}>@{ellipsis(id, 10)}</Text>
		</TouchableOpacity>
	);
};

export default SlashtagURL;
