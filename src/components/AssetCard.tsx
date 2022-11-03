import React, { memo, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { View, Pressable, Text01M, Caption13M } from '../styles/components';
import Money from '../components/Money';

const AssetCard = ({
	name,
	ticker,
	icon,
	satoshis,
	onPress,
}: {
	name: string;
	ticker: string;
	icon: ReactElement;
	satoshis: number;
	onPress: Function;
}): ReactElement => {
	return (
		<Pressable style={styles.container} onPress={onPress} color="transparent">
			<View color="transparent" style={styles.col1}>
				{icon}
				<View color="transparent" style={styles.titleContainer}>
					<Text01M>{name}</Text01M>
					<Caption13M color="gray1">{ticker}</Caption13M>
				</View>
			</View>

			<View color="transparent" style={styles.col2}>
				<Money
					sats={satoshis}
					enableHide={true}
					size="text01m"
					style={styles.value}
				/>
				<Money
					sats={satoshis}
					enableHide={true}
					size="caption13M"
					showFiat={true}
					color="gray1"
					style={styles.value}
				/>
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		minHeight: 88,
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	col1: {
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
	},
	col2: {
		alignContent: 'flex-end',
	},
	titleContainer: {
		marginLeft: 16,
	},
	value: {
		justifyContent: 'flex-end',
	},
});

export default memo(AssetCard);
