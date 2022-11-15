import React, { memo, ReactElement, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';

import {
	Caption13M,
	HeartbeatIcon,
	ReceiveIcon,
	SendIcon,
	Text01M,
	TouchableOpacity,
	View as ThemedView,
} from '../../styles/components';
import Money from '../../components/Money';
import ProfileImage from '../../components/ProfileImage';
import { IActivityItem } from '../../store/types/activity';
import Store from '../../store/types';
import { useProfile } from '../../hooks/slashtags';
import { EPaymentType } from '../../store/types/wallet';

const Avatar = ({ url }: { url: string }): ReactElement => {
	const { profile } = useProfile(url);
	return <ProfileImage url={url} image={profile?.image} size={32} />;
};

export const EmptyItem = ({
	onPress,
}: {
	onPress: () => void;
}): ReactElement => (
	<TouchableOpacity onPress={onPress} style={styles.root}>
		<View style={styles.item}>
			<View style={styles.col1}>
				<ThemedView color="yellow16" style={styles.iconCircle}>
					<HeartbeatIcon height={16} color="yellow" />
				</ThemedView>

				<View style={styles.col1text}>
					<Text01M>No Activity Yet</Text01M>
					<Caption13M
						color="gray1"
						style={styles.description}
						numberOfLines={1}>
						Receive some funds to get started
					</Caption13M>
				</View>
			</View>
		</View>
	</TouchableOpacity>
);

const ListItem = ({
	item,
	onPress,
}: {
	item: IActivityItem & { formattedDate: string };
	onPress: () => void;
}): ReactElement => {
	const { id, txType, value, message, formattedDate } = item;
	const slashTagsUrls = useSelector(
		(state: Store) => state.metadata?.slashTagsUrls,
	);
	const slashTagsUrl = useMemo(() => {
		if (slashTagsUrls && id in slashTagsUrls) {
			return slashTagsUrls[id];
		}
		return '';
	}, [id, slashTagsUrls]);

	const title = txType === EPaymentType.sent ? 'Sent' : 'Received';

	return (
		<TouchableOpacity onPress={onPress} style={styles.root}>
			<View style={styles.item}>
				<View style={styles.col1}>
					{slashTagsUrl ? (
						<Avatar url={slashTagsUrl} />
					) : (
						<ThemedView
							color={txType === EPaymentType.sent ? 'red16' : 'green16'}
							style={styles.iconCircle}>
							{txType === EPaymentType.sent ? (
								<SendIcon height={13} color="red" />
							) : (
								<ReceiveIcon height={13} color="green" />
							)}
						</ThemedView>
					)}

					<View style={styles.col1text}>
						<Text01M>{title}</Text01M>
						<Caption13M
							color="gray1"
							style={styles.description}
							numberOfLines={1}>
							{message || formattedDate}
						</Caption13M>
					</View>
				</View>
				<View style={styles.col2}>
					<Money
						sats={value}
						enableHide={true}
						size="text01m"
						style={styles.value}
						sign={txType === EPaymentType.sent ? '-' : '+'}
						highlight={true}
					/>
					<Money
						sats={value}
						enableHide={true}
						size="caption13M"
						style={styles.value}
						showFiat={true}
						color="gray1"
					/>
				</View>
			</View>
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
		marginLeft: 16,
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
	description: {
		marginTop: 4,
		overflow: 'hidden',
	},
});

export default memo(ListItem);
