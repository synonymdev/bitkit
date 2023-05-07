import React, { ReactElement, ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { TouchableOpacity } from '../styles/components';

const IconButton = ({
	children,
	disabled = false,
	style,
	onPress,
	testID,
}: {
	children: ReactNode;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	onPress?: () => void;
	testID?: string;
}): ReactElement => {
	const buttonStyles = useMemo(
		() => ({
			...styles.container,
			opacity: disabled ? 0.6 : 1,
		}),
		[disabled],
	);

	return (
		<TouchableOpacity
			style={[buttonStyles, style]}
			color="white08"
			activeOpacity={0.7}
			disabled={disabled}
			onPress={onPress}
			testID={testID}>
			{children}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		width: 48,
		height: 48,
		borderRadius: 9999,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default IconButton;
