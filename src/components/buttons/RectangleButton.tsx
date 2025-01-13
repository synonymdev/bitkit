import React, { ReactElement } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import useColors from '../../hooks/colors';
import colors from '../../styles/colors';
import { Pressable } from '../../styles/components';
import { BodyMB } from '../../styles/text';

const RectangleButton = ({
	icon,
	text,
	actions,
	disabled,
	testID,
	onPress,
}: {
	icon: ReactElement;
	text: string;
	actions?: ReactElement;
	disabled?: boolean;
	testID?: string;
	onPress: () => void;
}): ReactElement => {
	const { white16 } = useColors();

	return (
		<Pressable
			style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
			android_ripple={{ color: white16 }}
			color="white10"
			disabled={disabled}
			testID={testID}
			onPress={onPress}>
			<View style={styles.buttonIcon}>{icon}</View>
			<BodyMB color="white">{text}</BodyMB>
			<View style={styles.buttonActions}>{actions}</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 8,
		padding: 24,
		marginBottom: 8,
		height: 80,
	},
	buttonPressed: {
		...Platform.select({
			ios: {
				backgroundColor: colors.white16,
			},
		}),
	},
	buttonIcon: {
		marginRight: 16,
	},
	buttonActions: {
		marginLeft: 'auto',
	},
});

export default RectangleButton;
