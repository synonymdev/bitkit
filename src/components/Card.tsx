import React, { ReactElement, ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { View, TouchableOpacity } from '../styles/components';

interface ICard {
	style?: StyleProp<ViewStyle>;
	children?: ReactNode;
	color?: string;
	onPress?: () => void;
}
const Card = ({
	style = {},
	children = <View />,
	color = 'surface',
	onPress,
}: ICard): ReactElement => (
	<TouchableOpacity
		onPress={onPress}
		activeOpacity={onPress ? 0.6 : 1}
		color={color}
		style={[styles.container, style]}>
		{children}
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	container: {
		width: '100%',
		alignSelf: 'center',
		borderRadius: 15,
		marginVertical: 10,
		paddingVertical: 10,
		paddingHorizontal: 20,
		shadowColor: 'rgba(0, 0, 0, 0.1)',
		shadowOpacity: 0.9,
		elevation: 6,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 0 },
	},
});

export default Card;
