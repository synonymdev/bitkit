import React, { ReactElement, memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { SettingsScreenProps } from '../../../navigation/types';
import { Caption13Up } from '../../../styles/text';
import { ScrollView, View as ThemedView } from '../../../styles/components';
import SafeAreaInset from '../../../components/SafeAreaInset';
import { bitkitLedger } from '../../../utils/ledger';

const LedgerTransaction = ({
	route,
}: SettingsScreenProps<'LedgerTransaction'>): ReactElement => {
	const { ledgerTxId } = route.params;

	const tx = useMemo(
		() => bitkitLedger?.ledger.getTransaction(ledgerTxId)!,
		[ledgerTxId],
	);
	const { id, balancesBefore, amount, fromAcc, toAcc, metadata } = tx;
	const meta = JSON.stringify(metadata, null, 2);

	return (
		<ThemedView style={styles.container}>
			<ScrollView
				style={styles.override}
				contentContainerStyle={styles.override}>
				<SafeAreaInset type="top" />
				<Caption13Up style={styles.caption} color="gray1">
					id: {id}
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					amount: {amount}
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					From: {fromAcc.wallet} {fromAcc.account}
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					To: {toAcc.wallet} {toAcc.account}
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					BalanceBefore:
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					From: available: {balancesBefore.fromWallet.available} hold:{' '}
					{balancesBefore.fromWallet.hold}
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					To: available: {balancesBefore.toWallet.available} hold:{' '}
					{balancesBefore.toWallet.hold}
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					Metadata:
				</Caption13Up>
				<Caption13Up style={styles.caption} color="gray1">
					{`${meta}`}
				</Caption13Up>

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
});

export default memo(LedgerTransaction);
