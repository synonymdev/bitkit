import React, { ReactElement, memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { CaptionB, Display } from '../../styles/text';
import { LightningCircleIcon, TransferIcon } from '../../styles/icons';
import { View as ThemedView } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import ActivityHeader from '../../components/ActivityHeader';
import WalletOnboarding from '../../components/WalletOnboarding';
import Money from '../../components/Money';
import Button from '../../components/buttons/Button';
import ActivityList from './ActivityList';
import { useBalance } from '../../hooks/wallet';
import { useAppSelector } from '../../hooks/redux';
import { EActivityType } from '../../store/types/activity';
import { activityItemsSelector } from '../../store/reselect/activity';
import { WalletScreenProps } from '../../navigation/types';

const imageSrc = require('../../assets/illustrations/coin-stack-x-2.png');

const ActivitySpending = ({
	navigation,
}: WalletScreenProps<'ActivitySpending'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const { lightningBalance, balanceInTransferToSpending } = useBalance();
	const items = useAppSelector(activityItemsSelector);

	const spendingItems = useMemo(() => {
		return items.filter((item) => {
			return item.activityType === EActivityType.lightning;
		});
	}, [items]);

	const filter = useMemo(() => {
		return {
			types: [EActivityType.lightning],
			includeTransfers: true,
		};
	}, []);

	const showOnboarding = lightningBalance === 0 && spendingItems.length === 0;

	const onTransfer = (): void => {
		navigation.navigate('LightningRoot', { screen: 'QuickSetup' });
	};

	const canTransfer = !!lightningBalance;

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('spending.title')}
				icon={<LightningCircleIcon width={32} height={32} />}
			/>

			<View style={styles.imageContainer} pointerEvents="none">
				<Image style={styles.image} source={imageSrc} />
			</View>

			<View style={styles.content}>
				<ActivityHeader
					label={t('activity_transfer_spending')}
					balance={lightningBalance}
				/>

				{balanceInTransferToSpending !== 0 && (
					<View style={styles.transfer}>
						<View style={styles.transferText}>
							<TransferIcon style={styles.transferIcon} color="white50" />
							<CaptionB color="white50">
								{t('details_transfer_subtitle')}
							</CaptionB>
						</View>
						<Money
							sats={balanceInTransferToSpending}
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
								i18nKey="spending.onboarding"
								components={{ accent: <Display color="purple" /> }}
							/>
						}
					/>
				) : (
					<>
						<Button
							style={styles.button}
							text="Transfer To Savings"
							variant="secondary"
							size="large"
							icon={<TransferIcon height={16} width={16} />}
							disabled={!canTransfer}
							testID="TransferToSavings"
							onPress={onTransfer}
						/>
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
		top: -15,
		right: -155,
		zIndex: 1,
	},
	image: {
		width: 330,
		height: 330,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	transfer: {
		flexDirection: 'row',
		paddingTop: 8,
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

export default memo(ActivitySpending);
