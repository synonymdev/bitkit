import React, { memo, ReactElement } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text01M, Text02M } from '../styles/text';
import { PenIcon } from '../styles/icons';
import Money from '../components/Money';

const ImageText = ({
	title,
	description,
	icon,
	value,
	onPress,
}: {
	title: string;
	description: string;
	icon: ReactElement;
	value: number;
	onPress?: () => void;
}): ReactElement => {
	// TODO: make this component more reusable

	return (
		<TouchableOpacity
			style={styles.container}
			activeOpacity={onPress ? 0.6 : 1}
			onPress={onPress}>
			<View style={styles.textColumn}>
				{icon}
				<View style={styles.titleContainer}>
					<Text01M>{title}</Text01M>
					<Text02M color="gray1">{description}</Text02M>
				</View>
			</View>

			<View style={styles.valueColumn}>
				<View style={styles.valueRow}>
					<Money
						style={styles.value}
						sats={value}
						size="text01m"
						symbol={true}
						enableHide={true}
					/>
					<PenIcon style={styles.valueIcon} height={14} width={14} />
				</View>
				<Money
					style={styles.value}
					sats={value}
					size="text02m"
					color="gray1"
					symbol={true}
					unitType="secondary"
					enableHide={true}
				/>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	textColumn: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
	},
	valueColumn: {
		alignContent: 'flex-end',
	},
	titleContainer: {
		marginLeft: 16,
	},
	value: {
		justifyContent: 'flex-end',
	},
	valueRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	valueIcon: {
		marginLeft: 2,
	},
});

export default memo(ImageText);
