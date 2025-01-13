import React, { memo, ReactElement, ReactNode } from 'react';
import {
	StyleSheet,
	TouchableOpacity,
	TouchableOpacityProps,
	View,
} from 'react-native';

import { View as StyledView } from '../../styles/components';
import { Checkmark } from '../../styles/icons';
import { BodyM, Caption } from '../../styles/text';

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
				activeOpacity={0.7}
				{...props}>
				<View style={styles.leftColumn}>
					<View>
						<BodyM color="white">{label}</BodyM>
						{description && <Caption color="secondary">{description}</Caption>}
					</View>
				</View>
				<View style={styles.rightColumn}>
					<StyledView
						style={[styles.checkbox, checked && styles.checked]}
						color={checked ? 'brand32' : 'white10'}>
						{checked && <Checkmark color="brand" height={22} width={22} />}
					</StyledView>
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
	checkbox: {
		borderRadius: 8,
		borderColor: '#636363',
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		height: 32,
		width: 32,
	},
	checked: {
		borderColor: '#FF4400',
	},
});

export default CheckButton;
