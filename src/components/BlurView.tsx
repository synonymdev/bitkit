import React, { ReactElement, ReactNode } from 'react';
import { StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';
import { BlurView as Blur } from '@react-native-community/blur';
import { View } from '../styles/components';

type BlurViewProps = {
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
};

const BlurView = ({ style, ...props }: BlurViewProps): ReactElement => {
	return Platform.OS === 'ios' ? (
		<Blur {...props} style={[styles.containerIos, style]} />
	) : (
		<View {...props} style={[styles.containerAndroid, style]} />
	);
};

const styles = StyleSheet.create({
	containerIos: {},
	containerAndroid: {
		backgroundColor: 'rgba(20, 20, 20, 0.95)',
	},
});

export default BlurView;
