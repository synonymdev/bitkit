import React, { memo, ReactElement } from 'react';
import {
	View,
	GestureResponderEvent,
	Pressable,
	StyleSheet,
} from 'react-native';
import { Text01M, Caption13M } from '../styles/text';
import Money from '../components/Money';
import { ClockIcon } from '../styles/icons';

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
		<Pressable style={styles.container} onPress={onPress} testID={testID}>
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
					/>
				</View>
				<Money
					sats={satoshis}
					enableHide={true}
					size="caption13M"
					showFiat={true}
					color="gray1"
				/>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		paddingBottom: 24,
		// marginBottom: 24,
		flexDirection: 'row',
		justifyContent: 'space-between',
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
