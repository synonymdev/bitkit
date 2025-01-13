import React, { ReactElement, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastConfig, ToastConfigParams } from 'react-native-toast-message';

import BlurView from '../components/BlurView';
import ToastGradient from '../components/ToastGradient';
import colors from '../styles/colors';
import { BodyMSB, Caption } from '../styles/text';
import { IThemeColors } from '../styles/themes';

const Toast = ({
	type,
	text1,
	text2,
}: ToastConfigParams<any>): ReactElement => {
	const insets = useSafeAreaInsets();
	const dimensions = useWindowDimensions();

	let color: keyof IThemeColors = 'white';
	let gradientColor = colors.black;

	if (type === 'success') {
		color = 'green';
		gradientColor = '#1d2f1c';
	}

	if (type === 'info') {
		color = 'blue';
		gradientColor = '#032e56';
	}

	if (type === 'lightning') {
		color = 'purple';
		gradientColor = '#2b1637';
	}

	if (type === 'warning') {
		color = 'brand';
		gradientColor = '#3c1001';
	}

	if (type === 'error') {
		color = 'red';
		gradientColor = '#491f25';
	}

	const containerStyles = useMemo(
		() => ({
			...styles.container,
			// fix Toast overlapping with iPhone 14 Dynamic Island
			...(insets.top > 47 ? { margin: 14 } : {}),
			borderColor: colors[color],
		}),
		[insets.top, color],
	);

	return (
		<BlurView style={[{ width: dimensions.width - 16 * 2 }, containerStyles]}>
			<ToastGradient style={styles.gradient} color={gradientColor} />
			<BodyMSB color={color}>{text1}</BodyMSB>
			<Caption>{text2}</Caption>
		</BlurView>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		borderWidth: 1,
		padding: 16,
		position: 'relative',
		overflow: 'hidden',
	},
	gradient: {
		...StyleSheet.absoluteFillObject,
	},
});

export const toastConfig: ToastConfig = {
	success: (props) => <Toast {...props} />,
	info: (props) => <Toast {...props} />,
	lightning: (props) => <Toast {...props} />,
	warning: (props) => <Toast {...props} />,
	error: (props) => <Toast {...props} />,
};
