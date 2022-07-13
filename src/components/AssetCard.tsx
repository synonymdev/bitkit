import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import {
	View,
	Pressable,
	Text02M,
	Caption13M,
	Text01M,
} from '../styles/components';
import Money from '../components/Money';

const AssetCard = ({
	name,
	ticker,
	icon,
	satoshis,
	onPress,
	disabled,
}: {
	name: string;
	ticker: string;
	icon: ReactElement;
	satoshis?: number;
	onPress?: Function;
	disabled?: boolean;
}): ReactElement => {
	const container = useMemo(
		() => [styles.container, disabled && { opacity: 0.3 }],
		[disabled],
	);

	return (
		<Pressable style={container} onPress={onPress} color="transparent">
			<View color="transparent" style={styles.col1}>
				{icon}
				<View color="transparent" style={styles.titleContainer}>
					<Text02M>{name}</Text02M>
					<Caption13M color="gray1">{ticker}</Caption13M>
				</View>
			</View>

			<View color="transparent" style={styles.col2}>
				{disabled || satoshis === undefined ? (
					<Text01M>Coming soon</Text01M>
				) : (
					<>
						<Money
							sats={satoshis}
							hide={true}
							size="text01m"
							style={styles.value}
						/>
						<Money
							sats={satoshis}
							hide={true}
							size="caption13M"
							showFiat={true}
							color="gray1"
							style={styles.value}
						/>
					</>
				)}
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	container: {
		minHeight: 88,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	col1: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
	},
	col2: {
		display: 'flex',
		alignContent: 'flex-end',
	},
	titleContainer: {
		marginHorizontal: 12,
	},
	value: {
		justifyContent: 'flex-end',
	},
});

export default memo(AssetCard);
