import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
	Caption13M,
	ReceiveIcon,
	SendIcon,
	Text01M,
	TimerIconAlt,
	TouchableOpacity,
	View as ThemedView,
} from '../../styles/components';
import Button from '../../components/Button';
import Money from '../../components/Money';
import { IActivityItem, EActivityTypes } from '../../store/types/activity';
import { canBoost } from '../../utils/wallet/transactions';
import { toggleView } from '../../store/actions/user';

const ListItem = memo(
	({
		item,
		onPress,
	}: {
		item: IActivityItem & { formattedDate: string };
		onPress: () => void;
	}): ReactElement => {
		const { value, txType, confirmed, formattedDate, activityType, id } = item;

		let title;
		if (txType === 'sent') {
			title = confirmed ? 'Sent' : 'Sending...';
		} else {
			title = confirmed ? 'Received' : 'Receiving...';
		}

		const showBoost = useMemo(() => {
			if (confirmed) {
				return false;
			}
			if (activityType !== EActivityTypes.onChain) {
				return false;
			}
			return canBoost(id).canBoost;
		}, [confirmed, activityType, id]);

		const handleBoost = (): void => {
			toggleView({
				view: 'boostPrompt',
				data: { isOpen: true, activityItem: item },
			});
		};

		return (
			<TouchableOpacity onPress={onPress} style={styles.root}>
				<View style={styles.item}>
					<View style={styles.col1}>
						<ThemedView
							color={txType === 'sent' ? 'red16' : 'green16'}
							style={styles.iconCircle}>
							{txType === 'sent' ? (
								<SendIcon height={13} color="red" />
							) : (
								<ReceiveIcon height={13} color="green" />
							)}
						</ThemedView>
						<View>
							<Text01M>{title}</Text01M>
							<Caption13M color={'gray1'} style={styles.date} numberOfLines={1}>
								{formattedDate}
							</Caption13M>
						</View>
					</View>
					<View style={styles.col2}>
						<Money
							sats={value}
							hide={true}
							size="text01m"
							style={styles.value}
							sign={txType === 'sent' ? '-' : '+'}
							highlight={true}
						/>
						<Money
							sats={value}
							hide={true}
							size="caption13M"
							style={styles.value}
							showFiat={true}
							color="gray1"
						/>
					</View>
				</View>
				{showBoost && (
					<View style={styles.showBoost}>
						<Button
							text="Boost Transaction"
							color="yellow08"
							icon={<TimerIconAlt color="yellow" />}
							onPress={handleBoost}
						/>
					</View>
				)}
			</TouchableOpacity>
		);
	},
);

const styles = StyleSheet.create({
	root: {
		paddingBottom: 16,
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	item: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	col1: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
	},
	col2: {
		display: 'flex',
		justifyContent: 'flex-end',
	},
	iconCircle: {
		borderRadius: 20,
		width: 32,
		height: 32,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 14,
	},
	value: {
		justifyContent: 'flex-end',
	},
	date: {
		marginTop: 4,
		overflow: 'hidden',
	},
	showBoost: {
		marginTop: 8,
		marginLeft: 48,
		flexDirection: 'row',
	},
});

export default memo(ListItem);
