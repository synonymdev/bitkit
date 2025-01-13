import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import Money from '../../components/Money';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import SwipeToConfirm from '../../components/SwipeToConfirm';
import Button from '../../components/buttons/Button';
import { useAppSelector } from '../../hooks/redux';
import { useSwitchUnit } from '../../hooks/wallet';
import { TransferScreenProps } from '../../navigation/types';
import { openChannelsSelector } from '../../store/reselect/lightning';
import { View as ThemedView, TouchableOpacity } from '../../styles/components';
import { Checkmark } from '../../styles/icons';
import { Caption13Up, Display } from '../../styles/text';

const image = require('../../assets/illustrations/piggybank.png');

const SavingsConfirm = ({
	navigation,
	route,
}: TransferScreenProps<'SavingsConfirm'>): ReactElement => {
	const switchUnit = useSwitchUnit();
	const { t } = useTranslation('lightning');
	const openChannels = useAppSelector(openChannelsSelector);

	const selectedChannels = route.params?.channels;
	const hasSelected = selectedChannels && selectedChannels.length > 0;
	const channels = selectedChannels ?? openChannels;
	const hasMultiple = openChannels.length > 1;

	const amount = channels.reduce((acc, channel) => {
		return acc + channel.balance_sat;
	}, 0);

	const onAdvanced = (): void => {
		navigation.navigate('SavingsAdvanced');
	};

	const onSelectAll = (): void => {
		navigation.navigate('SavingsConfirm');
	};

	const onConfirm = (): void => {
		navigation.navigate('SavingsProgress', { channels });
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('transfer.nav_title')} />
			<View style={styles.content} testID="TransferConfirm">
				<Display>
					<Trans
						t={t}
						i18nKey="transfer.confirm"
						components={{ accent: <Display color="brand" /> }}
					/>
				</Display>

				<View style={styles.amount}>
					<Caption13Up style={styles.amountLabel} color="secondary">
						{t('savings_confirm.label')}
					</Caption13Up>

					<TouchableOpacity onPress={switchUnit}>
						<Money sats={amount} size="display" symbol={true} />
					</TouchableOpacity>
				</View>

				{hasMultiple && (
					<View style={styles.buttons}>
						{hasSelected ? (
							<Button
								text={t('savings_confirm.transfer_all')}
								testID="TransferSelectAll"
								onPress={onSelectAll}
							/>
						) : (
							<Button
								text={t('advanced')}
								testID="TransferAdvanced"
								onPress={onAdvanced}
							/>
						)}
					</View>
				)}

				<View style={styles.imageContainer}>
					<Image style={styles.image} source={image} />
				</View>

				<View style={styles.buttonContainer}>
					<SwipeToConfirm
						text={t('transfer.swipe')}
						color="brand"
						icon={<Checkmark width={30} height={30} color="black" />}
						onConfirm={onConfirm}
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
	amount: {
		marginTop: 26,
	},
	amountLabel: {
		marginBottom: 16,
	},
	buttons: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 23,
	},
	imageContainer: {
		flex: 1,
		alignItems: 'center',
	},
	image: {
		flex: 1,
		resizeMode: 'contain',
		width: 256,
		transform: [{ rotateY: '180deg' }],
	},
	buttonContainer: {
		marginTop: 'auto',
	},
});

export default SavingsConfirm;
