import React, { memo, ReactElement, ReactNode } from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';
import { Switch } from '../styles/components';
import { IThemeColors } from '../styles/themes';

const SwitchRow = ({
	children,
	color,
	isEnabled,
	style,
	onPress,
}: {
	children: ReactNode;
	color?: keyof IThemeColors;
	isEnabled: boolean;
	style?: StyleProp<ViewStyle>;
	onPress: () => void;
}): ReactElement => {
	return (
		<>
			<TouchableOpacity
				style={[styles.container, style]}
				activeOpacity={1}
				onPress={onPress}>
				<View style={styles.leftColumn}>{children}</View>
				<View style={styles.rightColumn}>
					<Switch value={isEnabled} color={color} onValueChange={onPress} />
				</View>
			</TouchableOpacity>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingVertical: 8,
	},
	leftColumn: {
		flex: 1,
		justifyContent: 'center',
	},
	rightColumn: {
		justifyContent: 'center',
		alignItems: 'flex-end',
		alignSelf: 'center',
	},
});

export default memo(SwitchRow);
