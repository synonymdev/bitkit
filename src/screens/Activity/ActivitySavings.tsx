import React, { ReactElement, memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { CaptionB, Display } from '../../styles/text';
import { BitcoinCircleIcon, TransferIcon } from '../../styles/icons';
import { View as ThemedView } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import ActivityHeader from '../../components/ActivityHeader';
import WalletOnboarding from '../../components/WalletOnboarding';
import Money from '../../components/Money';
import ActivityList from './ActivityList';
import { useBalance } from '../../hooks/wallet';
import { useAppSelector } from '../../hooks/redux';
import { EActivityType } from '../../store/types/activity';
import { activityItemsSelector } from '../../store/reselect/activity';
import type { WalletScreenProps } from '../../navigation/types';

const ActivitySavings = ({
	navigation,
}: WalletScreenProps<'ActivitySavings'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { onchainBalance, balanceInTransferToSavings } = useBalance();
	const items = useAppSelector(activityItemsSelector);

	const savingsItems = useMemo(() => {
		return items.filter((item) => {
			return item.activityType === EActivityType.onchain;
		});
	}, [items]);

	const filter = useMemo(() => {
		return {
			types: [EActivityType.onchain],
			includeTransfers: true,
		};
	}, []);

	const showOnboarding = onchainBalance === 0 && savingsItems.length === 0;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('savings.title')}
				icon={<BitcoinCircleIcon width={32} height={32} />}
				onClosePress={navigation.popToTop}
			/>

			<View style={styles.content}>
				<ActivityHeader
					label={t('activity_transfer_savings')}
					balance={onchainBalance}
				/>

				{balanceInTransferToSavings !== 0 && (
					<View style={styles.transfer}>
						<View style={styles.transferText}>
							<TransferIcon style={styles.transferIcon} color="red" />
							<CaptionB color="red">{t('details_transfer_subtitle')}</CaptionB>
						</View>
						<Money
							sats={balanceInTransferToSavings}
							size="captionB"
							color="red"
						/>
					</View>
				)}

				<View style={styles.divider} />

				{showOnboarding ? (
					<WalletOnboarding
						text={
							<Trans
								t={t}
								i18nKey="savings.onboarding"
								components={{ accent: <Display color="brand" /> }}
							/>
						}
					/>
				) : (
					<View style={styles.activity}>
						<ActivityList filter={filter} showFooterButton={true} />
					</View>
				)}
			</View>
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
	transfer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 4,
		paddingBottom: 10,
	},
	transferText: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	transferIcon: {
		marginRight: 3,
	},
	divider: {
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
		borderTopWidth: 1,
		marginTop: 8,
	},
	activity: {
		flex: 1,
		marginTop: 16,
	},
});

export default memo(ActivitySavings);
