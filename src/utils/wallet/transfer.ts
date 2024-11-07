import {
	getAddressFromScriptPubKey,
	EPaymentType,
	IFormattedTransaction,
	Result,
} from 'beignet';
import { err, ok } from '@synonymdev/result';
import lm, { ldk } from '@synonymdev/react-native-ldk';

import { getCurrentWallet, getSelectedNetwork, refreshWallet } from '.';
import { btcToSats } from '../conversion';
import { getBoostedTransactionParents } from '../boost';
import { getTransactions } from './electrum';
import {
	ETransferStatus,
	ETransferType,
	TTransfer,
} from '../../store/types/wallet';
import { dispatch } from '../../store/helpers';
import { createTransaction } from './transactions';
import { addTransfer } from '../../store/slices/wallet';
import {
	getNetworkForBeignet,
	updateSendTransaction,
} from '../../store/actions/wallet';

/**
 * Get the transfer object for a given transaction if it exists
 * @param {tx} IFormattedTransaction
 */
export const getTransferForTx = async (
	tx: IFormattedTransaction,
): Promise<TTransfer | undefined> => {
	const { currentWallet, selectedNetwork } = getCurrentWallet();
	const transfers = currentWallet.transfers[selectedNetwork];

	if (tx.type === EPaymentType.sent) {
		const transfersToSpending = transfers.filter((t) => {
			return t.type === ETransferType.open;
		});

		// check if the tx is a transfer to spending
		let transferToSpending = transfersToSpending.find((t) => {
			return t.txId === tx.txid;
		});

		// check if the tx is a transfer that was boosted
		if (!transferToSpending) {
			const boostedParents = getBoostedTransactionParents({ txId: tx.txid });
			const isBoosted = boostedParents.length > 0;
			if (isBoosted) {
				transferToSpending = transfersToSpending.find((t) => {
					const boostedParent = boostedParents.find((txId) => {
						return t.txId === txId;
					});
					return t.txId === boostedParent;
				});
			}
		}

		if (transferToSpending) {
			return transferToSpending;
		}
	}

	// check if the tx is a transfer to savings
	if (tx.type === EPaymentType.received) {
		const transfersToSavings = transfers.filter(
			(t) => t.type !== ETransferType.open,
		);
		// if the funding tx is in the transfer list it's a mutual close
		const transferToSavings = transfersToSavings.find((t) => {
			const txInput = tx.vin.find((vin) => t.txId === vin.txid);
			return !!txInput;
		});
		if (transferToSavings) {
			return transferToSavings;
		}

		// If we haven't found a transfer yet, check if the tx is a sweep from a force close
		// check that tx amount matches first to avoid unnecessary Electrum calls
		const inputValue = btcToSats(tx.totalInputValue);
		const matched = transfersToSavings.filter((t) => {
			return t.type === ETransferType.forceClose && t.amount === inputValue;
		});

		if (matched.length > 0) {
			// call Electrum to check if the tx has a parent that funded a channel
			// if so the tx is probably a sweep from a force close
			const txResponse = await getTransactions({
				txHashes: [{ tx_hash: tx.vin[0].txid }],
			});
			if (txResponse.isOk()) {
				const txData = txResponse.value.data;
				if (txData.length !== 0) {
					const parentTx = txData[0].result;
					return matched.find((t) => t.txId === parentTx.vin[0].txid);
				}
			}
		}
	}
};

/**
 * Creates, broadcasts a new funded channel.
 * @param {EAvailableNetwork} [selectedNetwork]
 * @param {TWalletName} [selectedWallet]
 * @returns {Promise<Result<string>>}
 */
export const createFundedChannel = async ({
	counterPartyNodeId,
	localBalance,
}: {
	counterPartyNodeId: string;
	localBalance: number;
}): Promise<Result<string>> => {
	const remoteBalance = 0;
	const createRes = await lm.createChannel({
		counterPartyNodeId,
		channelValueSats: localBalance + remoteBalance,
		pushSats: remoteBalance,
	});

	if (createRes.isErr()) {
		return err(createRes.error.message);
	}

	const { value_satoshis, output_script, temp_channel_id } = createRes.value;

	const selectedNetwork = getSelectedNetwork();
	const network = getNetworkForBeignet(selectedNetwork);
	const address = getAddressFromScriptPubKey(output_script, network);

	updateSendTransaction({
		rbf: false,
		outputs: [{ address, value: value_satoshis, index: 0 }],
	});

	const createTxResult = await createTransaction();
	if (createTxResult.isErr()) {
		// toast shown from createTransaction
		return err(createTxResult.error.message);
	}

	const fundingTransaction = createTxResult.value.hex;

	const fundRes = await ldk.fundChannel({
		temporaryChannelId: temp_channel_id,
		counterPartyNodeId,
		fundingTransaction,
	});

	if (fundRes.isErr()) {
		return err('fundRes.error.message');
	}

	dispatch(
		addTransfer({
			txId: createTxResult.value.id,
			type: ETransferType.open,
			status: ETransferStatus.pending,
			amount: localBalance,
			confirmsIn: 3,
		}),
	);

	// Refresh onchain wallet
	refreshWallet({ lightning: false }).then();

	return ok('success');
};
