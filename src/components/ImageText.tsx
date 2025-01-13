import React, { memo, ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Money from '../components/Money';
import { PencilIcon } from '../styles/icons';
import { BodyMSB, BodySSB } from '../styles/text';

const ImageText = ({
	title,
	description,
	icon,
	value,
	testID,
	onPress,
}: {
	title: string;
	description: string;
	icon: ReactElement;
	value: number;
	testID?: string;
	onPress?: () => void;
}): ReactElement => {
	// TODO: make this component more reusable

	return (
		<TouchableOpacity
			testID={testID}
			style={styles.container}
			activeOpacity={onPress ? 0.7 : 1}
			onPress={onPress}>
			<View style={styles.textColumn}>
				{icon}
				<View style={styles.titleContainer}>
					<BodyMSB>{title}</BodyMSB>
					<BodySSB color="secondary">{description}</BodySSB>
				</View>
			</View>

			<View style={styles.valueColumn}>
				<View style={styles.valueRow}>
					<Money
						style={styles.value}
						sats={value}
						size="bodyMSB"
						symbol={true}
						enableHide={true}
					/>
					<PencilIcon style={styles.valueIcon} height={13} width={13} />
				</View>
				<Money
					style={styles.value}
					sats={value}
					size="bodySSB"
					color="secondary"
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
		marginLeft: 4,
	},
});

export default memo(ImageText);
