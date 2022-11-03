import React, { useMemo } from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { BasicProfile } from '../store/types/slashtags';
import { Jdenticon } from './Jdenticon';
import { SvgXml } from 'react-native-svg';

export const ProfileImage = ({
	url,
	image,
	style,
	size = 32,
}: {
	url?: string;
	image?: BasicProfile['image'];
	style?: ViewStyle;
	size: number;
}): JSX.Element => {
	// Support svg data urls
	const xml = useMemo(() => {
		if (image?.startsWith('data:image/svg+xml;base64,')) {
			const base64 = image.replace('data:image/svg+xml;base64,', '');
			return Buffer.from(base64, 'base64').toString();
		} else if (image?.startsWith('data:image/svg+xml,')) {
			const encoded = image.replace('data:image/svg+xml', '');
			const decoded = decodeURIComponent(encoded);
			return decoded;
		}
	}, [image]);

	const _style: ViewStyle = useMemo(
		() => ({
			backgroundColor: xml ? 'transparent' : '#222',
			borderRadius: size,
			overflow: 'hidden',
			height: size,
			width: size,
			...style,
		}),
		[xml, size, style],
	);

	return (
		<View style={_style}>
			{xml ? (
				<SvgXml width={size} height={size} xml={xml} />
			) : image ? (
				<Image source={{ uri: image, width: size, height: size }} />
			) : url ? (
				<Jdenticon value={url} size={size} />
			) : (
				<View style={_style} />
			)}
		</View>
	);
};

export default ProfileImage;
