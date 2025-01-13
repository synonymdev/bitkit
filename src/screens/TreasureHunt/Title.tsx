import {
	Canvas,
	LinearGradient,
	Text,
	useFont,
	vec,
} from '@shopify/react-native-skia';
import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useScreenSize } from '../../hooks/screen';

export const Title = ({
	text,
	indent = 0,
}: {
	text: string;
	indent?: number;
}): ReactElement => {
	const { isSmallScreen } = useScreenSize();
	const fontSize = isSmallScreen ? 80 : 96;

	const font = useFont(
		require('../../assets/fonts/Damion-Regular.ttf'),
		fontSize,
	);

	const gradient = ['#FF4400', '#FFD200'];
	const words = text.split(' ');
	const firstWords = words.slice(0, words.length - 1).join(' ');
	const lastWord = words.pop()!;

	return (
		<Canvas style={styles.root}>
			{font && (
				<>
					<Text x={10} y={fontSize} text={firstWords} font={font}>
						<LinearGradient
							start={vec(0, 0)}
							end={vec(0, fontSize * 2)}
							colors={gradient}
						/>
					</Text>
					<Text x={35 + indent} y={fontSize * 1.8} text={lastWord} font={font}>
						<LinearGradient
							start={vec(0, fontSize * 0.5)}
							end={vec(0, fontSize * 1.8)}
							colors={gradient}
						/>
					</Text>
				</>
			)}
		</Canvas>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
});

export default Title;
