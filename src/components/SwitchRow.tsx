import React, { memo, ReactElement } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { GestureResponderEvent } from 'react-native-modal';
import { Switch } from '../styles/components';
import Divider from './Divider';

const SwitchRow = ({
	children,
	isEnabled,
	showDivider = true,
	onPress,
}: {
	children: ReactElement;
	isEnabled: boolean;
	showDivider?: boolean;
	onPress: (event: GestureResponderEvent) => void;
}): ReactElement => {
	return (
		<>
			<TouchableOpacity
				onPress={onPress}
				activeOpacity={1}
				style={styles.container}>
				<View style={styles.leftColumn}>{children}</View>
				<View style={styles.rightColumn}>
					<Switch onValueChange={onPress} value={isEnabled} />
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
		alignItems: 'flex-start',
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
