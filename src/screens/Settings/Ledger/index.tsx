import React, { ReactElement, memo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { TBitkitTransaction } from 'ledger/dist/bitkit-ledger';
import { TDestination } from 'ledger/dist/ledger';

import { SettingsScreenProps } from '../../../navigation/types';
import { Caption13Up, Text01S } from '../../../styles/text';
import {
	ScrollView,
	View as ThemedView,
	TouchableOpacity as ThemedTouchableOpacity,
} from '../../../styles/components';
import Button from '../../../components/Button';
import SafeAreaInset from '../../../components/SafeAreaInset';
import {
	bitkitLedger,
	initLedger,
	resetLedger,
	syncLedger2,
} from '../../../utils/ledger';
import { useBalance } from '../../../hooks/wallet';
import { getLightningChannels } from '../../../utils/lightning';

const accToEmoji = (acc: TDestination): string => {
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
	const isSend = toAcc.wallet.includes('_remote');
	const fromText = accToEmoji(fromAcc);
	const toText = accToEmoji(toAcc);

	let color;
	if (toAcc.account === 'hold') {
		color = 'white16'
	} else if (toAcc.wallet.includes('_remote')) {
		color = 'red16'
	} else {
		color = 'green16'
	}

	return (
		<ThemedTouchableOpacity
			style={styles.item}
			color={color}
			onPress={onPress}>
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
	const balance = useBalance();

	const reRender = (): NodeJS.Timeout =>
		setTimeout(() => setRerender((prev) => prev + 1), 10);

	const handleInit = async (): Promise<void> => {
		const res = await initLedger();
		Alert.alert('Init', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	const handleSync = async (): Promise<void> => {
		const res = await syncLedger2();
		Alert.alert('Init', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	const handleReset = async (): Promise<void> => {
		const res = await resetLedger();
		Alert.alert('Reset', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	const xxx = async () => {
		const res = await getLightningChannels();
		if (res.isErr()) {
			Alert.alert('getLightningChannels', res.isErr() ? res.error.message : 'Success');
			return
		}

		console.info('channels', res.value)
	}

	const handleTransaction = (id: number): void => {
		navigation.navigate('LedgerTransaction', { ledgerTxId: id });
	};

	return (
		<ThemedView style={styles.container}>
			<ScrollView
				style={styles.override}
				contentContainerStyle={styles.override}>
				<SafeAreaInset type="top" />
				<Caption13Up style={styles.caption} color="gray1">
					Ledger
				</Caption13Up>
				{!bitkitLedger ? (
					<>
						<Text01S color="white">Ledger is not initialized yet</Text01S>
						<Button
							text="Initialize"
							style={styles.button}
							onPress={handleInit}
						/>
					</>
				) : (
					<>
						<Button text="Sync" style={styles.button} onPress={handleSync} />
						<Button text="Reset" style={styles.button} onPress={handleReset} />
						<Button text="Channels" style={styles.button} onPress={xxx} />
						<Caption13Up style={styles.caption} color="gray1">
							Balances
						</Caption13Up>
						<View style={styles.item}>
							<View style={styles.column4}>
								<Text01S color="gray1" />
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
								<Caption13Up color="gray1">
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
								<Caption13Up color="gray1">
									{bitkitLedger?.ledger.getWalletBalance('lightning').hold}
								</Caption13Up>
							</View>
						</View>

						<Caption13Up style={styles.caption} color="gray1">
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
								<Caption13Up color="gray1">
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
								<Caption13Up color="gray1">
									{
										bitkitLedger?.ledger.getWalletBalance('lightning_remote')
											.hold
									}
								</Caption13Up>
							</View>
						</View>

						<Caption13Up style={styles.caption} color="gray1">
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
	container: {
		flex: 1,
		marginHorizontal: 16,
	},
	caption: {
		marginTop: 16,
		marginBottom: 4,
	},
	override: {
		flexGrow: 1,
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
	button: {
		minWidth: 64,
		marginBottom: 8,
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
