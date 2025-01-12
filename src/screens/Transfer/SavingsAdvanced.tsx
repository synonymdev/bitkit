import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { BodyM, Caption13Up, Display } from '../../styles/text';
import {
	View as ThemedView,
	ScrollView,
	TouchableOpacity,
} from '../../styles/components';
import SafeAreaInset from '../../components/SafeAreaInset';
import NavigationHeader from '../../components/NavigationHeader';
import SwitchRow from '../../components/SwitchRow';
import Money from '../../components/Money';
import Button from '../../components/buttons/Button';
import { useSwitchUnit } from '../../hooks/wallet';
import { useAppSelector } from '../../hooks/redux';
import { useLightningChannelName } from '../../hooks/lightning';
import { TChannel } from '../../store/types/lightning';
import { openChannelsSelector } from '../../store/reselect/lightning';
import type { TransferScreenProps } from '../../navigation/types';

const Channel = ({
	channel,
	isEnabled,
	onPress,
}: {
	channel: TChannel;
	isEnabled: boolean;
	onPress: () => void;
}): ReactElement => {
	const channelName = useLightningChannelName(channel);

	return (
		<SwitchRow style={styles.channel} isEnabled={isEnabled} onPress={onPress}>
			<Caption13Up style={styles.channelLabel} color="secondary">
				{channelName}
			</Caption13Up>
			<Money sats={channel.balance_sat} size="bodySSB" symbol={true} />
		</SwitchRow>
	);
};

const SavingsAdvanced = ({
	navigation,
}: TransferScreenProps<'SavingsAdvanced'>): ReactElement => {
	const switchUnit = useSwitchUnit();
	const { t } = useTranslation('lightning');
	const channels = useAppSelector(openChannelsSelector);
	const channelIds = channels.map((channel) => channel.channel_id);
	const [selected, setSelected] = useState<string[]>(channelIds);

	const selectedChannels = channels.filter((channel) => {
		return selected.includes(channel.channel_id);
	});

	const onToggle = (channelId: string): void => {
		setSelected((prev) => {
			if (prev.includes(channelId)) {
				return prev.filter((id) => id !== channelId);
			}
			return [...prev, channelId];
		});
	};

	const onContinue = (): void => {
		if (selected.length === channels.length) {
			navigation.navigate('SavingsConfirm');
		} else {
			navigation.navigate('SavingsConfirm', { channels: selectedChannels });
		}
	};

	const amount = selectedChannels.reduce((acc, channel) => {
		return acc + channel.balance_sat;
	}, 0);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('transfer.nav_title')} />
			<View style={styles.content} testID="TransferConfirm">
				<Display>
					<Trans
						t={t}
						i18nKey={'savings_advanced.title'}
						components={{ accent: <Display color="brand" /> }}
					/>
				</Display>

				<BodyM style={styles.text} color="secondary">
					{t('savings_advanced.text')}
				</BodyM>

				<ScrollView contentContainerStyle={styles.channels}>
					{Object.values(channels).map((channel) => (
						<Channel
							key={channel.channel_id}
							channel={channel}
							isEnabled={selected.includes(channel.channel_id)}
							onPress={(): void => onToggle(channel.channel_id)}
						/>
					))}
				</ScrollView>

				<View style={styles.amount}>
					<Caption13Up style={styles.amountLabel} color="secondary">
						{t('savings_advanced.total')}
					</Caption13Up>
					<TouchableOpacity onPress={switchUnit}>
						<Money sats={amount} size="display" symbol={true} />
					</TouchableOpacity>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						text={t('continue')}
						size="large"
						disabled={selected.length === 0}
						testID="TransferAdvanced"
						onPress={onContinue}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	text: {
		marginTop: 4,
		marginBottom: 32,
	},
	amountLabel: {
		marginTop: 16,
		marginBottom: 16,
	},
	channels: {
		flexGrow: 1,
		gap: 16,
	},
	channel: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	channelLabel: {
		marginBottom: 8,
	},
	amount: {
		marginTop: 'auto',
	},
	buttonContainer: {
		marginTop: 32,
	},
});

export default SavingsAdvanced;
