import React, { ReactElement, useMemo } from 'react';
import { Image, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

const SvgImage = ({
	image,
	style,
	size = 32,
}: {
	image: string;
	style?: ViewStyle;
	size?: number;
}): ReactElement => {
	// Support svg data urls
	const xml = useMemo(() => {
		if (image.startsWith('<svg')) {
			return image;
		}
		if (image.startsWith('data:image/svg+xml;base64,')) {
			const base64 = image.replace('data:image/svg+xml;base64,', '');
			return Buffer.from(base64, 'base64').toString();
		}
		if (image.startsWith('data:image/svg+xml,')) {
			const encoded = image.replace('data:image/svg+xml', '');
			const decoded = decodeURIComponent(encoded);
			return decoded;
		}
	}, [image]);

	return (
		<View style={[{ height: size, width: size }, style]}>
			{xml ? (
				<SvgXml width={size} height={size} xml={xml} />
			) : (
				<Image source={{ uri: image, width: size, height: size }} />
			)}
		</View>
	);
};

export default SvgImage;
