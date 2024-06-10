import React, { memo, ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TouchableOpacity, View as ThemedView } from '../../styles/components';
import { Caption13M, Text01M } from '../../styles/text';
import {
	HeartbeatIcon,
	HourglassSimpleIcon,
	ReceiveIcon,
	SendIcon,
	TimerIconAlt,
	TransferIcon,
	XIcon,
} from '../../styles/icons';
import Money from '../../components/Money';
import ProfileImage from '../../components/ProfileImage';
import {
	EActivityType,
	IActivityItem,
	TLightningActivityItem,
	TOnchainActivityItem,
} from '../../store/types/activity';
import { useAppSelector } from '../../hooks/redux';
import { useProfile2 } from '../../hooks/slashtags2';
import { useFeeText } from '../../hooks/fees';
import { slashTagsUrlSelector } from '../../store/reselect/metadata';
import { truncate } from '../../utils/helpers';
import { getActivityItemDate } from '../../utils/activity';
import { transferSelector } from '../../store/reselect/wallet';
import { EPaymentType } from 'beignet';

export const ListItem = ({
	title,
	description,
	amount,
	icon,
	isSend,
	exists = true,
}: {
	title: string;
	description: string;
	icon: ReactNode;
	amount?: number;
	isSend?: boolean;
	exists?: boolean;
}): ReactElement => (
	<>
		{icon}
		<View style={styles.text}>
			<Text01M color={exists ? undefined : 'red'}>{title}</Text01M>
			<Caption13M color={exists ? 'gray1' : 'red'}>
				{truncate(description, 35)}
			</Caption13M>
		</View>

		{amount ? (
			<View style={styles.amount}>
				<Money
					color={exists ? undefined : 'red'}
					sats={amount}
					enableHide={true}
					size="text01m"
					sign={isSend ? '-' : '+'}
					unitType="primary"
				/>
				<Money
					sats={amount}
					enableHide={true}
					size="caption13M"
					color={exists ? 'gray1' : 'red'}
					unitType="secondary"
				/>
			</View>
		) : null}
	</>
);

const OnchainListItem = ({
	item,
	icon,
}: {
	item: TOnchainActivityItem;
	icon: JSX.Element;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const {
		txId,
		txType,
		value,
		fee,
		feeRate,
		confirmed,
		confirmTimestamp,
		timestamp,
		isBoosted,
		isTransfer,
		exists = true,
	} = item;
	const { shortRange: feeRateDescription } = useFeeText(feeRate);
	const transfer = useAppSelector((state) => transferSelector(state, txId));

	const isSend = txType === EPaymentType.sent;
	const isTransferToSpending = isTransfer && isSend;

	let title = t(isSend ? 'activity_sent' : 'activity_received');
	const amount = isSend ? value + fee : value;

	let description;
	if (confirmed) {
		// NOTE: for users with earlier versions use the timestamp
		description = getActivityItemDate(confirmTimestamp ?? timestamp);
	} else if (isBoosted) {
		description = t('activity_confirms_in_boosted', { feeRateDescription });
		icon = (
			<ThemedView style={styles.icon} color="yellow16">
				<TimerIconAlt height={13} color="yellow" />
			</ThemedView>
		);
	} else if (feeRateDescription) {
		description = t('activity_confirms_in', { feeRateDescription });
	} else {
		description = t('activity_low_fee');
	}

	if (transfer) {
		if (isTransferToSpending) {
			title = t('activity_transfer_spending');
			if (confirmed) {
				description = t('activity_transfer_spending_done');
			} else {
				const duration = 10;
				description = t('activity_transfer_spending_pending', { duration });
			}
			icon = (
				<ThemedView style={styles.icon} color="purple16">
					<TransferIcon color="purple" />
				</ThemedView>
			);
		} else {
			title = t('activity_transfer_savings');
			description = t('activity_transfer_savings_done');
			icon = (
				<ThemedView style={styles.icon} color="brand16">
					<TransferIcon color="brand" />
				</ThemedView>
			);
		}
	}

	return (
		<ListItem
			title={title}
			description={description}
			amount={amount}
			icon={icon}
			exists={exists}
			isSend={isSend}
		/>
	);
};

const LightningListItem = ({
	item,
	icon,
}: {
	item: TLightningActivityItem;
	icon: JSX.Element;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const { txType, status, value, fee, message, timestamp } = item;

	let title = t(
		txType === EPaymentType.sent ? 'activity_sent' : 'activity_received',
	);

	if (status === 'pending') {
		title = t('activity_pending');
		icon = (
			<ThemedView style={styles.icon} color="purple16">
				<HourglassSimpleIcon color="purple" width={16} />
			</ThemedView>
		);
	}

	if (status === 'failed') {
		title = t('activity_failed');
		icon = (
			<ThemedView style={styles.icon} color="purple16">
				<XIcon color="purple" width={16} />
			</ThemedView>
		);
	}

	const description = message || getActivityItemDate(timestamp);
	const isSend = txType === EPaymentType.sent;
	const amount = isSend ? value + (fee ?? 0) : value;

	return (
		<ListItem
			title={title}
			description={description}
			icon={icon}
			amount={amount}
			isSend={isSend}
		/>
	);
};

export const EmptyItem = ({
	onPress,
}: {
	onPress: () => void;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const title = t('activity_no');
	const description = t('activity_no_explain');
	const icon = (
		<ThemedView color="yellow16" style={styles.icon}>
			<HeartbeatIcon height={16} color="yellow" />
		</ThemedView>
	);

	return (
		<View style={styles.empty}>
			<TouchableOpacity style={styles.pressable} onPress={onPress}>
				<ListItem title={title} description={description} icon={icon} />
			</TouchableOpacity>
		</View>
	);
};

const Avatar = ({ url }: { url: string }): ReactElement => {
	const { profile } = useProfile2(url);
	return (
		<ProfileImage
			style={styles.icon}
			url={url}
			image={profile.image}
			size={32}
		/>
	);
};

const ActivityListItem = ({
	item,
	onPress,
	testID,
}: {
	item: IActivityItem;
	onPress: () => void;
	testID?: string;
}): ReactElement => {
	const { id, activityType, txType } = item;
	const profileUrl = useAppSelector((state) => slashTagsUrlSelector(state, id));
	const isSend = txType === EPaymentType.sent;
	const isInstant = activityType === EActivityType.lightning;

	const icon = profileUrl ? (
		<Avatar url={profileUrl} />
	) : (
		<ThemedView style={styles.icon} color={isInstant ? 'purple16' : 'brand16'}>
			{isSend ? (
				<SendIcon height={13} color={isInstant ? 'purple' : 'brand'} />
			) : (
				<ReceiveIcon height={13} color={isInstant ? 'purple' : 'brand'} />
			)}
		</ThemedView>
	);

	return (
		<View style={styles.root}>
			<TouchableOpacity
				style={styles.pressable}
				onPress={onPress}
				testID={testID}>
				{activityType === EActivityType.onchain && (
					<OnchainListItem item={item} icon={icon} />
				)}
				{activityType === EActivityType.lightning && (
					<LightningListItem item={item} icon={icon} />
				)}
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	empty: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	root: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		marginBottom: 24,
	},
	pressable: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingBottom: 24,
		minHeight: 65,
	},
	icon: {
		borderRadius: 20,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		alignSelf: 'center',
		marginRight: 16,
	},
	text: {
		justifyContent: 'space-between',
		marginRight: 'auto',
	},
	amount: {
		justifyContent: 'space-between',
		alignItems: 'flex-end',
		marginLeft: 'auto',
	},
});

export default memo(ActivityListItem);
