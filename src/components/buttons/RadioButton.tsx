import React, { memo, ReactElement, ReactNode } from 'react';
import {
	GestureResponderEvent,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

import { Checkmark } from '../../styles/icons';
import { BodyM, Caption } from '../../styles/text';

type RadioButtonProps = {
	label: ReactNode;
	checked: boolean;
	description?: ReactNode;
	style?: StyleProp<ViewStyle>;
	onPress?: (event: GestureResponderEvent) => void;
};

export const RadioButton = memo(
	({
		label,
		checked,
		description,
		style,
		onPress,
	}: RadioButtonProps): ReactElement => {
		return (
			<TouchableOpacity
				style={[styles.item, style]}
				activeOpacity={0.7}
				onPress={onPress}>
				<View style={styles.leftColumn}>
					<View>
						<BodyM color="white">{label}</BodyM>
						{description && <Caption color="secondary">{description}</Caption>}
					</View>
				</View>
				<View style={styles.rightColumn}>
					{checked && <Checkmark color="brand" height={32} width={32} />}
				</View>
			</TouchableOpacity>
		);
	},
);

export type RadioButtonItem = { label: string; value: string };

type RadioButtonGroupProps = {
	data: RadioButtonItem[];
	value: string;
	onPress?: (value: string) => void;
};

export const RadioButtonGroup = memo(
	({ data, value, onPress }: RadioButtonGroupProps): ReactElement => {
		return (
			<>
				{data.map((item, index) => {
					// remove borderBottom from last item
					if (index === data.length - 1) {
						return (
							<RadioButton
								key={item.value}
								label={item.label}
								checked={value === item.value}
								onPress={(): void => onPress?.(item.value)}
								style={styles.itemLast}
							/>
						);
					}

					return (
						<RadioButton
							key={item.value}
							label={item.label}
							checked={value === item.value}
							onPress={(): void => onPress?.(item.value)}
						/>
					);
				})}
			</>
		);
	},
);

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		minHeight: 56,
	},
	itemLast: {
		borderBottomWidth: 0,
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
