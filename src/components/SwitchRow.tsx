import React, { memo, ReactElement, ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Switch } from '../styles/components';
import { IThemeColors } from '../styles/themes';
import Divider from './Divider';

const SwitchRow = ({
	children,
	color,
	isEnabled,
	showDivider = true,
	onPress,
}: {
	children: ReactNode;
	color?: keyof IThemeColors;
	isEnabled: boolean;
	showDivider?: boolean;
	onPress: () => void;
}): ReactElement => {
	return (
		<>
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={1}
				style={styles.container}>
				<View style={styles.leftColumn}>{children}</View>
				<View style={styles.rightColumn}>
					<Switch value={isEnabled} color={color} onValueChange={onPress} />
				</View>
			</TouchableOpacity>
			{showDivider && <Divider style={styles.divider} />}
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
	divider: {
		marginTop: 5,
		marginBottom: 5,
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
