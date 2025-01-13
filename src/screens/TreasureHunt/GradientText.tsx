import {
	Canvas,
	LinearGradient,
	Text,
	useFont,
	vec,
} from '@shopify/react-native-skia';
import React, { ReactElement } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

export const GradientText = ({
	text,
	style,
}: {
	text: string;
	style?: StyleProp<ViewStyle>;
}): ReactElement => {
	const fontSize = 54;

	const font = useFont(
		require('../../assets/fonts/Damion-Regular.ttf'),
		fontSize,
	);

	if (!font) {
		return <></>;
	}

	const gradient = ['#FF4400', '#FFD200'];
	const textWidth = font.getTextWidth(text);

	return (
		<Canvas style={[{ width: textWidth + 7 }, style]}>
			<Text x={0} y={35} text={text} font={font}>
				<LinearGradient
					start={vec(0, 0)}
					end={vec(0, fontSize)}
					positions={[0, 0.7]}
					colors={gradient}
				/>
			</Text>
		</Canvas>
	);
};

export default GradientText;
