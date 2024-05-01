import { TBitkitTransaction, TDestination } from '@synonymdev/ledger';
import React, { ReactElement, memo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import Button from '../../../components/Button';
import NavigationHeader from '../../../components/NavigationHeader';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { useBalance } from '../../../hooks/wallet';
import { SettingsScreenProps } from '../../../navigation/types';
import {
	ScrollView,
	TouchableOpacity as ThemedTouchableOpacity,
	View as ThemedView,
} from '../../../styles/components';
import { Caption13Up, BodyM } from '../../../styles/text';
import {
	bitkitLedger,
	deleteLedger,
	syncLedger,
	exportLedger,
} from '../../../utils/ledger';

export const accToEmoji = (acc: TDestination): string => {
	let wallet = '';
	if (acc.wallet === 'onchain') {
		wallet = '🏠🔗';
	} else if (acc.wallet === 'lightning') {
		wallet = '🏠⚡️';
	} else if (acc.wallet === 'onchain_remote') {
		wallet = '🌐🔗';
	} else if (acc.wallet === 'lightning_remote') {
		wallet = '🌐⚡️';
	}

	let account = '';
	if (acc.account === 'available') {
		account = '💰';
	} else if (acc.account === 'hold') {
		account = '🔒';
	}

	return wallet + account;
};

const Transaction = ({
	tx,
	onPress,
}: {
	tx: TBitkitTransaction;
	onPress: () => void;
}): ReactElement => {
	const { id, amount, fromAcc, toAcc } = tx;
	const fromText = accToEmoji(fromAcc);
	const toText = accToEmoji(toAcc);

	let color;
	if (toAcc.account === 'hold') {
		color = 'white16';
	} else if (toAcc.wallet.includes('_remote')) {
		color = 'red16';
	} else {
		color = 'green16';
	}

	return (
		<ThemedTouchableOpacity style={styles.item} color={color} onPress={onPress}>
			<View style={styles.id}>
				<Caption13Up>{id}</Caption13Up>
			</View>
			<View style={styles.amount}>
				<Caption13Up>{amount}</Caption13Up>
			</View>
			<View>
				<Caption13Up>
					{fromText} ⟶ {toText}
				</Caption13Up>
			</View>
		</ThemedTouchableOpacity>
	);
};

const Ledger = ({
	navigation,
}: SettingsScreenProps<'Ledger'>): ReactElement => {
	const [_, setRerender] = useState(0);
	const [syncing, setSyncing] = useState(false);
	const balance = useBalance();

	const reRender = (): NodeJS.Timeout =>
		setTimeout(() => setRerender((prev) => prev + 1), 10);

	const handleSync = async (): Promise<void> => {
		setSyncing(true);
		const res = await syncLedger();
		Alert.alert('Init', res.isErr() ? res.error.message : 'Success');
		setSyncing(false);
	};

	const handleReset = async (): Promise<void> => {
		const res = await deleteLedger();
		Alert.alert('Reset', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	const handleExport = async (): Promise<void> => {
		const res = await exportLedger();
		Alert.alert('Export', res.isErr() ? res.error.message : 'Success');
	};

	const handleTransaction = (id: number): void => {
		navigation.navigate('LedgerTransaction', { ledgerTxId: id });
	};

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title="Ledger"
				onClosePress={(): void => navigation.goBack()}
			/>
			<ScrollView contentContainerStyle={styles.content}>
				{!bitkitLedger ? (
					<>
						<BodyM color="white">Ledger is not initialized yet</BodyM>
					</>
				) : (
					<>
						<View style={styles.buttonRow}>
							<Button
								text="Sync"
								style={styles.button}
								onPress={handleSync}
								disabled={syncing}
							/>
							<Button
								text="Reset"
								style={styles.button}
								onPress={handleReset}
							/>
							<Button
								text="Export"
								style={styles.button}
								onPress={handleExport}
							/>
						</View>
						<Caption13Up style={styles.caption} color="white50">
							Balances
						</Caption13Up>
						<View style={styles.item}>
							<View style={styles.column4}>
								<BodyM color="white50" />
							</View>
							<View style={styles.column4}>
								<Caption13Up>Actual</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up>Expected</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up>Hold</Caption13Up>
							</View>
						</View>
						<View style={styles.item}>
							<View style={styles.column4}>
								<Caption13Up>Onchain</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up>{balance.onchainBalance}</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up>
									{bitkitLedger?.ledger.getWalletBalance('onchain').available}
								</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up color="gray">
									{bitkitLedger?.ledger.getWalletBalance('onchain').hold}
								</Caption13Up>
							</View>
						</View>
						<View style={styles.item}>
							<View style={styles.column4}>
								<Caption13Up>Lightning</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up>{balance.lightningBalance}</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up>
									{bitkitLedger?.ledger.getWalletBalance('lightning').available}
								</Caption13Up>
							</View>
							<View style={styles.column4}>
								<Caption13Up color="white50">
									{bitkitLedger?.ledger.getWalletBalance('lightning').hold}
								</Caption13Up>
							</View>
						</View>

						<Caption13Up style={styles.caption} color="white50">
							Remote wallets
						</Caption13Up>
						<View style={styles.item}>
							<View style={styles.column3} />
							<View style={styles.column3}>
								<Caption13Up>available</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up>hold</Caption13Up>
							</View>
						</View>
						<View style={styles.item}>
							<View style={styles.column3}>
								<Caption13Up>Onchain</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up>
									{
										bitkitLedger?.ledger.getWalletBalance('onchain_remote')
											.available
									}
								</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up color="white50">
									{bitkitLedger?.ledger.getWalletBalance('onchain_remote').hold}
								</Caption13Up>
							</View>
						</View>
						<View style={styles.item}>
							<View style={styles.column3}>
								<Caption13Up>Lightning</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up>
									{
										bitkitLedger?.ledger.getWalletBalance('lightning_remote')
											.available
									}
								</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up color="white50">
									{
										bitkitLedger?.ledger.getWalletBalance('lightning_remote')
											.hold
									}
								</Caption13Up>
							</View>
						</View>

						<Caption13Up style={styles.caption} color="white50">
							Transactions
						</Caption13Up>

						{bitkitLedger.ledger
							.getTransactions()
							.reverse()
							.map((tx) => {
								return (
									<Transaction
										key={tx.id}
										tx={tx}
										onPress={(): void => {
											handleTransaction(tx.id);
										}}
									/>
								);
							})}
					</>
				)}

				<SafeAreaInset type="bottom" />
			</ScrollView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
		justifyContent: 'space-between',
	},
	content: {
		paddingHorizontal: 16,
		flexGrow: 1,
	},
	caption: {
		marginTop: 16,
		marginBottom: 4,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		paddingVertical: 8,
	},
	column4: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '25%',
	},
	column3: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '25%',
	},
	buttonRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	button: {
		minWidth: 64,
		marginRight: 8,
		marginBottom: 4,
	},
	id: {
		minWidth: 5,
		paddingLeft: 4,
	},
	amount: {
		minWidth: 100,
		paddingLeft: 4,
	},
});

export default memo(Ledger);
