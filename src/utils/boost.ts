import { EBoostType, IBoostedTransactions, Wallet as TWallet } from 'beignet';

import { getActivityStore, getWalletStore } from '../store/helpers';
import { IActivityItem, TOnchainActivityItem } from '../store/types/activity';
import { TWalletName } from '../store/types/wallet';
import { EAvailableNetwork } from './networks';
import {
	getOnChainWalletAsync,
	getSelectedNetwork,
	getSelectedWallet,
} from './wallet';

/**
 * Returns boosted transactions object.
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {IBoostedTransactions}
 */
export const getBoostedTransactions = ({
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): IBoostedTransactions => {
	return getWalletStore().wallets[selectedWallet]?.boostedTransactions[
		selectedNetwork
	];
};

/**
 * Returns an array of parents for a boosted transaction id.
 * @param {TWallet} wallet
 * @param {string} txId
 * @param {IBoostedTransactions} [boostedTransactions]
 * @returns {string[]}
 */
export const getBoostedTransactionParents = ({
	wallet,
	txId,
	boostedTransactions,
}: {
	wallet: TWallet;
	txId: string;
	boostedTransactions?: IBoostedTransactions;
}): string[] => {
	return wallet.getBoostedTransactionParents({
		txid: txId,
		boostedTransactions,
	});
};

/**
 * Determines if a given txId has any boosted parents.
 * // TODO: Migrate to Beignet
 * @param {string} txId
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {boolean}
 */
export const hasBoostedParents = ({
	wallet,
	txId,
	boostedTransactions,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	wallet: TWallet;
	txId: string;
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): boolean => {
	if (!boostedTransactions) {
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostedParents = getBoostedTransactionParents({
		wallet,
		txId,
		boostedTransactions,
	});
	return boostedParents.length > 0;
};

/**
 * Returns the initially boosted transaction's activity item for a given txId.
 * @param {string} txId
 * @param {IActivityItem[]} [items]
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {TOnchainActivityItem|undefined}
 */
const getRootParentActivity = async ({
	txId,
	items,
	boostedTransactions,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	txId: string;
	items: TOnchainActivityItem[];
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): Promise<TOnchainActivityItem | undefined> => {
	const wallet = await getOnChainWalletAsync();
	if (!boostedTransactions) {
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostedParents = getBoostedTransactionParents({
		wallet,
		txId,
		boostedTransactions,
	});
	if (!boostedParents.length) {
		return undefined;
	}
	const filteredItem = items.find((item) => item.txId === boostedParents[0]);
	return filteredItem;
};

/**
 * Returns an array of activity items for the provided array of parent txids.
 * CURRENTLY UNUSED
 * // TODO: Migrate to Beignet
 * @param {string[]} [parents]
 * @param {IActivityItem[]} [items]
 */
export const getParentsActivity = ({
	parents = [],
	items = [],
}: {
	parents?: string[];
	items?: IActivityItem[];
}): IActivityItem[] => {
	if (!items) {
		items = getActivityStore().items;
	}
	return items.filter((i) => parents.includes(i.id));
};

/**
 * Loop through activity items and format them to be displayed as boosted if applicable.
 * @param {TOnchainActivityItem[]} [items]
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {TOnchainActivityItem[]}
 */
export const formatBoostedActivityItems = async ({
	items,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	items: TOnchainActivityItem[];
	boostedTransactions: IBoostedTransactions;
	selectedWallet: TWalletName;
	selectedNetwork: EAvailableNetwork;
}): Promise<TOnchainActivityItem[]> => {
	const formattedItems: TOnchainActivityItem[] = [];

	for (const item of items) {
		const { txId } = item;

		// if boosted tx don't add for now
		if (txId in boostedTransactions) {
			continue;
		}

		const rootParent = await getRootParentActivity({
			txId,
			items,
			boostedTransactions,
			selectedWallet,
			selectedNetwork,
		});

		// if we can't find a parent tx leave as is
		if (!rootParent) {
			formattedItems.push(item);
			continue;
		}

		const parentBoostType = boostedTransactions[rootParent.txId].type;

		// if it's an RBF tx leave as is, only mark as boosted
		if (parentBoostType === EBoostType.rbf) {
			formattedItems.push({ ...item, isBoosted: true });
			continue;
		}

		const value = await calculateBoostTransactionValue({
			currentActivityItem: item,
			items,
			boostedTransactions,
			includeFee: false,
		});

		formattedItems.push({
			...item,
			// keep id from the parent tx
			id: rootParent.id,
			txType: rootParent.txType,
			value,
			fee: rootParent.fee + item.fee,
			address: rootParent.address,
			isBoosted: true,
		});
	}

	return formattedItems;
};

/**
 * Returns the end value of a series of boost transactions.
 * @param {TOnchainActivityItem} currentActivityItem
 * @param {string[]} parents
 * @param {TOnchainActivityItem[]} items
 * @param {IBoostedTransactions} boostedTransactions
 * @returns {number}
 */
export const calculateBoostTransactionValue = async ({
	currentActivityItem,
	items,
	boostedTransactions,
	includeFee = false,
}: {
	currentActivityItem: TOnchainActivityItem;
	items: TOnchainActivityItem[];
	boostedTransactions: IBoostedTransactions;
	includeFee?: boolean;
}): Promise<number> => {
	const boostedTransaction = Object.values(boostedTransactions).find(
		(tx) => tx.childTransaction === currentActivityItem.txId,
	);
	if (!boostedTransaction) {
		return currentActivityItem.value;
	}
	const rootParent = await getRootParentActivity({
		txId: currentActivityItem.txId,
		items,
		boostedTransactions,
	});
	if (!rootParent) {
		return currentActivityItem.value;
	}

	// Set the beginning fee that we started with from root.
	let value = rootParent.value;

	if (includeFee) {
		// Subtract fee root value using each parent fee.
		const parents = boostedTransaction.parentTransactions;
		parents.forEach((parentTxid) => {
			const parent = boostedTransactions[parentTxid];
			value = Math.round(value - parent.fee);
		});
	}

	return value;
};
