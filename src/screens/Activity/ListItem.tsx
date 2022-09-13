import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

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
import ProfileImage from '../../components/ProfileImage';
import { IActivityItem, EActivityTypes } from '../../store/types/activity';
import { canBoost } from '../../utils/wallet/transactions';
import { toggleView } from '../../store/actions/user';
import Store from '../../store/types';
import { useRemote } from '../../hooks/slashtags';

const Avatar = ({ url }: { url: string }): ReactElement => {
	const { remote } = useRemote(url);
	return <ProfileImage url={url} image={remote?.profile?.image} size={32} />;
};

const ListItem = ({
	item,
	onPress,
}: {
	item: IActivityItem & { formattedDate: string };
	onPress: () => void;
}): ReactElement => {
	const { value, txType, confirmed, formattedDate, activityType, id } = item;
	const slashTagsUrl = useSelector(
		(state: Store) => state.metadata.slashTagsUrls,
	)[id];

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
					{slashTagsUrl ? (
						<Avatar url={slashTagsUrl} />
					) : (
						<ThemedView
							color={txType === 'sent' ? 'red16' : 'green16'}
							style={styles.iconCircle}>
							{txType === 'sent' ? (
								<SendIcon height={13} color="red" />
							) : (
								<ReceiveIcon height={13} color="green" />
							)}
						</ThemedView>
					)}

					<View style={styles.col1text}>
						<Text01M>{title}</Text01M>
						<Caption13M color="gray1" style={styles.date} numberOfLines={1}>
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
};

const styles = StyleSheet.create({
	root: {
		paddingBottom: 16,
		marginBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	item: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	col1: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	col1text: {
		marginLeft: 14,
	},
	col2: {
		justifyContent: 'flex-end',
	},
	iconCircle: {
		borderRadius: 20,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
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
