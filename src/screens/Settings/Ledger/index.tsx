import React, { ReactElement, memo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { SettingsScreenProps } from '../../../navigation/types';
import { Caption13Up, Text01S } from '../../../styles/text';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import Button from '../../../components/Button';
import SafeAreaInset from '../../../components/SafeAreaInset';
import {
	bitkitLedger,
	initLedger,
	saveLedger,
	syncLedger,
} from '../../../utils/ledger';
import { useBalance } from '../../../hooks/wallet';

const TransactionItem = (tx) => {
	return (
		<View style={styles.item}>
			<View />
		</View>
	);
};

const Ledger = ({}: SettingsScreenProps<'Ledger'>): ReactElement => {
	const [_, setRerender] = useState(0);
	const balance = useBalance();

	console.info('balance', balance);

	const reRender = () => setTimeout(() => setRerender((prev) => prev + 1), 10);

	const handleInit = async (): Promise<void> => {
		const res = await initLedger();
		Alert.alert('Init', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	const handleSave = async (): Promise<void> => {
		const res = await saveLedger();
		Alert.alert('Save', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	const handleSync = async (): Promise<void> => {
		const res = await syncLedger();
		Alert.alert('Init', res.isErr() ? res.error.message : 'Success');
		reRender();
	};

	console.info('rerender');
	console.info('bitkitLedger', bitkitLedger?.ledger.wallets);

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
				<Caption13Up style={styles.caption} color="gray1">
					Balances
				</Caption13Up>
						<View style={styles.item}>
							<View style={styles.column4}>
								<Text01S color="gray1"></Text01S>
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
								<Caption13Up color='gray1'>
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
								<Caption13Up color='gray1'>
									{bitkitLedger?.ledger.getWalletBalance('lightning').hold}
								</Caption13Up>
							</View>
						</View>

				<Caption13Up style={styles.caption} color="gray1">
					Remote wallets
				</Caption13Up>
						<View style={styles.item}>
							<View style={styles.column3}>
							</View>
							<View style={styles.column3}>
								<Caption13Up>available</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up>
									hold
								</Caption13Up>
							</View>
						</View>
						<View style={styles.item}>
							<View style={styles.column3}>
								<Caption13Up>Onchain</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up>
									{bitkitLedger?.ledger.getWalletBalance('onchain_remote').available}
								</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up color='gray1'>
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
									{bitkitLedger?.ledger.getWalletBalance('lightning_remote').available}
								</Caption13Up>
							</View>
							<View style={styles.column3}>
								<Caption13Up color='gray1'>
									{bitkitLedger?.ledger.getWalletBalance('lightning_remote').hold}
								</Caption13Up>
							</View>
						</View>

				<Caption13Up style={styles.caption} color="gray1">
					Transactions
				</Caption13Up>

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
});

export default memo(Ledger);
