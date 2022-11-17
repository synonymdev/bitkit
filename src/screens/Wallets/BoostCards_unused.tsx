// Component currenlty unused

import React, { memo, ReactElement, useCallback, useMemo } from 'react';
import { LayoutAnimation, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import Store from '../../store/types';
import { EPaymentType, IFormattedTransaction } from '../../store/types/wallet';
import {
	View,
	BoostIcon,
	Text02M,
	Caption13S,
	SubHeadM,
	Pressable,
} from '../../styles/components';
import { btcToSats } from '../../utils/helpers';
import { getDisplayValues } from '../../utils/exchange-rate';
import { canBoost } from '../../utils/wallet/transactions';
import { RootNavigationProp } from '../../navigation/types';

/**
 * Returns the appropriate text for the boost card.
 * @param {EPaymentType} type
 * @param {number} amount
 * @return string
 */
const getBoostText = ({
	type,
	amount,
}: {
	type: EPaymentType;
	amount: number;
}): string => {
	let text = 'Sent';
	if (type === EPaymentType.received) {
		text = 'Receiving';
	}
	if (amount.toString().includes('.')) {
		amount = btcToSats(amount);
	}
	const displayValue = getDisplayValues({ satoshis: amount });
	return `${text} ${displayValue.bitcoinFormatted} ${displayValue.bitcoinTicker}`;
};

const BoostCard = memo(
	({ text, txid }: { text: string; txid: string }): ReactElement => {
		const navigation = useNavigation<RootNavigationProp>();
		const activityItem = useSelector((store: Store) =>
			store.activity.items.find(({ id }) => id === txid),
		);

		if (!activityItem) {
			return <></>;
		}

		return (
			<View style={styles.row}>
				<View style={styles.col1}>
					<BoostIcon />
				</View>
				<View style={styles.col2}>
					<Text02M>{text}</Text02M>
					{/*
					 * Todo: Implement transaction time estimate method
					 */}
					<Caption13S>Confirms in 20-40min</Caption13S>
				</View>
				<View style={styles.col3}>
					<Pressable
						style={styles.boostButton}
						onPress={(): void =>
							navigation.navigate('ActivityDetail', { activityItem })
						}>
						<SubHeadM color="orange">Boost</SubHeadM>
					</Pressable>
				</View>
			</View>
		);
	},
	() => true,
);

const BoostCards = (): ReactElement | null => {
	const selectedNetwork = useSelector(
		(state: Store) => state.wallet.selectedNetwork,
	);
	const selectedWallet = useSelector(
		(state: Store) => state.wallet.selectedWallet,
	);
	const transactions: IFormattedTransaction = useSelector(
		(state: Store) =>
			state.wallet?.wallets[selectedWallet]?.transactions[selectedNetwork] ||
			[],
	);

	const boostedTransactions = useSelector(
		(state: Store) =>
			state.wallet?.wallets[selectedWallet]?.boostedTransactions[
				selectedNetwork
			],
	);

	const balance: number = useSelector(
		(state: Store) =>
			state.wallet?.wallets[selectedWallet]?.balance[selectedNetwork] || 0,
	);

	const unconfirmedTransactions = useMemo(
		() => Object.values(transactions).filter((tx) => tx.height < 1),
		[transactions],
	);

	const hasEnoughToBoost = useCallback(
		(txid): boolean => canBoost(txid).canBoost,
		//eslint-disable-next-line react-hooks/exhaustive-deps
		[balance],
	);

	LayoutAnimation.easeInEaseOut();

	if (Object.keys(unconfirmedTransactions).length <= 0) {
		return null;
	}

	return (
		<View>
			{Object.values(unconfirmedTransactions).map((tx, i) => {
				const satoshis = btcToSats(
					Math.abs(tx.matchedInputValue - tx.matchedOutputValue),
				);
				const boostText = getBoostText({
					type: tx.type,
					amount: satoshis,
				});
				const isCpfp =
					tx.matchedInputValue.toFixed(8) ===
					(tx.matchedOutputValue + tx.fee).toFixed(8);
				if (
					tx.height < 1 &&
					hasEnoughToBoost(tx.txid) &&
					!(tx.txid in boostedTransactions) &&
					!isCpfp
				) {
					return (
						<BoostCard key={`${tx.txid}${i}`} text={boostText} txid={tx.txid} />
					);
				}
			})}
			<View style={styles.separator} />
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		flex: 1.5,
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		marginVertical: 20.5,
	},
	col1: {
		flex: 1,
		alignItems: 'flex-start',
		justifyContent: 'center',
	},
	col2: {
		flex: 3,
		alignItems: 'flex-start',
		justifyContent: 'center',
	},
	col3: {
		flex: 2,
		alignItems: 'center',
		justifyContent: 'center',
	},
	boostButton: {
		height: 30,
		width: 71,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#282828',
		borderRadius: 10,
	},
	separator: {
		height: 0.5,
		backgroundColor: '#F3F3F3',
		opacity: 0.2,
		marginHorizontal: 10,
		marginBottom: 20.5,
	},
});

export default memo(BoostCards);
