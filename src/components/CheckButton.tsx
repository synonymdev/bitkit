import React, { memo, ReactElement, ReactNode } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	TouchableOpacityProps,
} from 'react-native';

import { Text01S, Checkmark, Caption13S } from '../styles/components';

interface CheckButtonProps extends TouchableOpacityProps {
	label: ReactNode;
	checked: boolean;
	description?: ReactNode;
}

const CheckButton = memo(
	({
		label,
		checked,
		description,
		style,
		...props
	}: CheckButtonProps): ReactElement => {
		return (
			<TouchableOpacity
				style={[styles.item, style]}
				activeOpacity={0.6}
				{...props}>
				<View style={styles.leftColumn}>
					<View>
						<Text01S color="white">{label}</Text01S>
						{description && (
							<Caption13S color="gray1">{description}</Caption13S>
						)}
					</View>
				</View>
				<View style={styles.rightColumn}>
					<Checkmark
						color={checked ? 'brand' : 'gray4'}
						height={30}
						width={30}
					/>
				</View>
			</TouchableOpacity>
		);
	},
);

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	leftColumn: {
		flex: 2.6,
		flexDirection: 'row',
		alignItems: 'center',
	},
	rightColumn: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-end',
		marginLeft: 'auto',
	},
});

export default CheckButton;
