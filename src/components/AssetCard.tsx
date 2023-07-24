import React, { memo, ReactElement } from 'react';
import { View, GestureResponderEvent, StyleSheet } from 'react-native';
import { ClockIcon } from '../styles/icons';
import { Text01M, Caption13M } from '../styles/text';
import { TouchableOpacity } from '../styles/components';
import Money from '../components/Money';

const AssetCard = ({
	name,
	ticker,
	icon,
	satoshis,
	pending,
	testID,
	onPress,
}: {
	name: string;
	ticker: string;
	icon: ReactElement;
	satoshis: number;
	pending?: boolean;
	testID?: string;
	onPress: (event: GestureResponderEvent) => void;
}): ReactElement => {
	return (
		<View style={styles.container}>
			<TouchableOpacity
				style={styles.pressable}
				testID={testID}
				onPress={onPress}>
				<View style={styles.icon}>{icon}</View>
				<View style={styles.text}>
					<Text01M>{name}</Text01M>
					<Caption13M color="gray1">{ticker}</Caption13M>
				</View>

				<View style={styles.amount}>
					<View style={styles.primary}>
						{/* TODO: change color depending on pending savings/spending */}
						{pending && <ClockIcon color="purple" />}
						<Money
							style={styles.primaryAmount}
							sats={satoshis}
							enableHide={true}
							size="text01m"
							unitType="primary"
						/>
					</View>
					<Money
						sats={satoshis}
						enableHide={true}
						size="caption13M"
						unitType="secondary"
						color="gray1"
					/>
				</View>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	pressable: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingBottom: 24,
		minHeight: 65,
	},
	icon: {
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	text: {
		justifyContent: 'space-between',
	},
	amount: {
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginLeft: 'auto',
	},
	primary: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	primaryAmount: {
		marginLeft: 8,
	},
});

export default memo(AssetCard);
