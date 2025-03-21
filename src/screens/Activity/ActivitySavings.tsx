import React, { ReactElement, memo, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import ActivityHeader from '../../components/ActivityHeader';
import Money from '../../components/Money';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import WalletOnboarding from '../../components/WalletOnboarding';
import Button from '../../components/buttons/Button';
import { useAppSelector } from '../../hooks/redux';
import { useBalance } from '../../hooks/wallet';
import { WalletScreenProps } from '../../navigation/types';
import { activityItemsSelector } from '../../store/reselect/activity';
import { spendingIntroSeenSelector } from '../../store/reselect/settings';
import { isGeoBlockedSelector } from '../../store/reselect/user';
import { EActivityType } from '../../store/types/activity';
import { View as ThemedView } from '../../styles/components';
import { BitcoinCircleIcon, TransferIcon } from '../../styles/icons';
import { CaptionB, Display } from '../../styles/text';
import ActivityList from './ActivityList';

const imageSrc = require('../../assets/illustrations/piggybank.png');

const ActivitySavings = ({
	navigation,
}: WalletScreenProps<'ActivitySavings'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { onchainBalance, balanceInTransferToSavings } = useBalance();
	const items = useAppSelector(activityItemsSelector);
	const isGeoBlocked = useAppSelector(isGeoBlockedSelector);
	const spendingIntroSeen = useAppSelector(spendingIntroSeenSelector);

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

	const onTransfer = (): void => {
		if (spendingIntroSeen) {
			navigation.navigate('TransferRoot', { screen: 'SpendingAmount' });
		} else {
			navigation.navigate('TransferRoot', { screen: 'SpendingIntro' });
		}
	};

	const canTransfer = !!onchainBalance && !isGeoBlocked;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('savings.title')}
				icon={<BitcoinCircleIcon width={32} height={32} />}
				showCloseButton={false}
			/>

			<View style={styles.imageContainer} pointerEvents="none">
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={styles.content}>
				<ActivityHeader balance={onchainBalance} />

				{balanceInTransferToSavings !== 0 && (
					<View style={styles.transfer}>
						<View style={styles.transferText}>
							<TransferIcon style={styles.transferIcon} color="white50" />
							<CaptionB color="white50">
								{t('details_transfer_subtitle')}
							</CaptionB>
						</View>
						<Money
							sats={balanceInTransferToSavings}
							size="captionB"
							color="white50"
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
					<>
						{canTransfer && (
							<Button
								style={styles.button}
								text="Transfer To Spending"
								variant="secondary"
								size="large"
								icon={<TransferIcon height={16} width={16} />}
								testID="TransferToSpending"
								onPress={onTransfer}
							/>
						)}
						<View style={styles.activity}>
							<ActivityList filter={filter} showFooterButton={true} />
						</View>
					</>
				)}
			</View>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	imageContainer: {
		position: 'absolute',
		top: 8,
		right: -124,
		zIndex: 1,
	},
	image: {
		width: 268,
		height: 268,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	transfer: {
		flexDirection: 'row',
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
	button: {
		marginTop: 16,
	},
	activity: {
		flex: 1,
	},
});

export default memo(ActivitySavings);
