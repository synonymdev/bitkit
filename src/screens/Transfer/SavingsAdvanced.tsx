import React, { ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { BodyM, Caption13Up, Display } from '../../styles/text';
import { View as ThemedView, TouchableOpacity } from '../../styles/components';
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
	onPress: (channel: TChannel) => void;
}): ReactElement => {
	const channelName = useLightningChannelName(channel);

	return (
		<SwitchRow
			style={styles.channel}
			isEnabled={isEnabled}
			onPress={() => onPress(channel)}>
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
	const [selected, setSelected] = useState<TChannel[]>(channels);

	const onToggle = (channel: TChannel): void => {
		setSelected((prev) => {
			return prev.includes(channel)
				? prev.filter((c) => c !== channel)
				: [...prev, channel];
		});
	};

	const onContinue = (): void => {
		if (selected.length === channels.length) {
			navigation.navigate('SavingsConfirm');
		} else {
			navigation.navigate('SavingsConfirm', { channels: selected });
		}
	};

	const amount = channels
		.filter((channel) => selected.includes(channel))
		.reduce((acc, channel) => acc + channel.balance_sat, 0);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('transfer.nav_title')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
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

				<View style={styles.channels}>
					{Object.values(channels).map((channel) => (
						<Channel
							key={channel.channel_id}
							channel={channel}
							isEnabled={selected.includes(channel)}
							onPress={onToggle}
						/>
					))}
				</View>

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
	},
	amountLabel: {
		marginTop: 16,
		marginBottom: 16,
	},
	amount: {
		marginTop: 'auto',
	},
	channels: {
		gap: 16,
		marginTop: 32,
	},
	channel: {
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	channelLabel: {
		marginBottom: 8,
	},
	buttonContainer: {
		marginTop: 32,
	},
});

export default SavingsAdvanced;
