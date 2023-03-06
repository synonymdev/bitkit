import React, { memo, ReactElement, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TouchableOpacity, View as ThemedView } from '../../styles/components';
import { Caption13M, Text01M } from '../../styles/text';
import {
	HeartbeatIcon,
	ReceiveIcon,
	SendIcon,
	TimerIconAlt,
	TransferIcon,
} from '../../styles/icons';
import Money from '../../components/Money';
import ProfileImage from '../../components/ProfileImage';
import {
	EActivityType,
	IActivityItemFormatted,
	TLightningActivityItemFormatted,
	TOnchainActivityItemFormatted,
} from '../../store/types/activity';
import { useAppSelector } from '../../hooks/redux';
import { useProfile } from '../../hooks/slashtags';
import { useFeeText } from '../../hooks/fees';
import { EPaymentType } from '../../store/types/wallet';
import { slashTagsUrlSelector } from '../../store/reselect/metadata';
import { truncate } from '../../utils/helpers';

export const ListItem = ({
	title,
	description,
	amount,
	icon,
	isSend,
}: {
	title: string;
	description: string;
	icon: ReactNode;
	amount?: number;
	isSend?: boolean;
}): ReactElement => (
	<>
		<View style={styles.columnLeft}>
			{icon}
			<View>
				<Text01M>{title}</Text01M>
				<Caption13M style={styles.description} color="gray1" numberOfLines={1}>
					{truncate(description, 35)}
				</Caption13M>
			</View>
		</View>

		{amount ? (
			<View style={styles.columnRight}>
				<Money
					style={styles.value}
					sats={amount}
					enableHide={true}
					size="text01m"
					sign={isSend ? '-' : '+'}
					highlight={true}
				/>
				<Money
					style={styles.value}
					sats={amount}
					enableHide={true}
					size="caption13M"
					showFiat={true}
					color="gray1"
				/>
			</View>
		) : null}
	</>
);

const OnchainListItem = ({
	item,
	icon,
}: {
	item: TOnchainActivityItemFormatted;
	icon: JSX.Element;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const {
		txType,
		value,
		feeRate,
		confirmed,
		isBoosted,
		isTransfer,
		formattedDate,
	} = item;
	const { shortRange: feeRateDescription } = useFeeText(feeRate);

	// TODO: check if transfer to savings or spending.
	const isTransferringToSavings = false;

	const isSend = txType === EPaymentType.sent;

	let title = t(isSend ? 'activity_sent' : 'activity_received');

	let description;
	if (confirmed) {
		description = formattedDate;
	} else if (isBoosted) {
		description = t('activity_confirms_in_boosted', { feeRateDescription });
		icon = (
			<ThemedView style={styles.icon} color="yellow16">
				<TimerIconAlt height={13} color="yellow" />
			</ThemedView>
		);
	} else {
		description = t('activity_confirms_in', { feeRateDescription });
	}

	if (isTransfer) {
		title = t('activity_transfer');

		if (isTransferringToSavings) {
			description = t(
				confirmed
					? 'activity_transfer_savings_done'
					: 'activity_transfer_savings_inprogress',
			);
			icon = (
				<ThemedView style={styles.icon} color="orange16">
					<TransferIcon height={13} color="orange" />
				</ThemedView>
			);
		} else {
			description = t(
				confirmed
					? 'activity_transfer_spending_done'
					: 'activity_transfer_spending_inprogres',
			);
			icon = (
				<ThemedView style={styles.icon} color="purple16">
					<TransferIcon height={13} color="purple" />
				</ThemedView>
			);
		}
	}

	return (
		<ListItem
			title={title}
			description={description}
			amount={value}
			icon={icon}
			isSend={isSend}
		/>
	);
};

const LightningListItem = ({
	item,
	icon,
}: {
	item: TLightningActivityItemFormatted;
	icon: JSX.Element;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const { txType, value, message, formattedDate } = item;
	const title = t(
		txType === EPaymentType.sent ? 'activity_sent' : 'activity_received',
	);
	const description = message || formattedDate;
	const isSend = txType === EPaymentType.sent;

	return (
		<ListItem
			title={title}
			description={description}
			icon={icon}
			amount={value}
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
		<TouchableOpacity style={styles.root} onPress={onPress}>
			<ListItem title={title} description={description} icon={icon} />
		</TouchableOpacity>
	);
};

const Avatar = ({ url }: { url: string }): ReactElement => {
	const { profile } = useProfile(url);
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
}: {
	item: IActivityItemFormatted;
	onPress: () => void;
}): ReactElement => {
	const { id, activityType, txType } = item;
	const profileUrl = useAppSelector((state) => slashTagsUrlSelector(state, id));
	const isSend = txType === EPaymentType.sent;

	const icon = profileUrl ? (
		<Avatar url={profileUrl} />
	) : (
		<ThemedView style={styles.icon} color={isSend ? 'red16' : 'green16'}>
			{isSend ? (
				<SendIcon height={13} color="red" />
			) : (
				<ReceiveIcon height={13} color="green" />
			)}
		</ThemedView>
	);

	return (
		<TouchableOpacity style={styles.root} onPress={onPress}>
			{activityType === EActivityType.onchain && (
				<OnchainListItem item={item} icon={icon} />
			)}
			{activityType === EActivityType.lightning && (
				<LightningListItem item={item} icon={icon} />
			)}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	root: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		paddingBottom: 16,
		marginBottom: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	columnLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		justifyContent: 'flex-end',
	},
	icon: {
		borderRadius: 20,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 16,
	},
	description: {
		marginTop: 4,
		overflow: 'hidden',
	},
	value: {
		justifyContent: 'flex-end',
	},
});

export default memo(ActivityListItem);
