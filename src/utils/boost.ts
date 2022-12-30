import { getSelectedNetwork, getSelectedWallet } from './wallet';
import { TAvailableNetworks } from './networks';
import { getActivityStore, getWalletStore } from '../store/helpers';
import { IActivityItem, TOnchainActivityItem } from '../store/types/activity';
import {
	EBoost,
	IBoostedTransactions,
	TWalletName,
} from '../store/types/wallet';

/**
 * Returns boosted transactions object.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {IBoostedTransactions}
 */
export const getBoostedTransactions = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): IBoostedTransactions => {
	if (!selectedWallet) {
		selectedWallet = getSelectedWallet();
	}
	if (!selectedNetwork) {
		selectedNetwork = getSelectedNetwork();
	}
	return getWalletStore().wallets[selectedWallet].boostedTransactions[
		selectedNetwork
	];
};

/**
 * Returns an array of parents for a boosted transaction id.
 * @param {string} txid
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {string[]}
 */
export const getBoostedTransactionParents = ({
	txid,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): string[] => {
	if (!boostedTransactions) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostObj = Object.values(boostedTransactions).find((boostObject) => {
		return boostObject.childTransaction === txid;
	});

	return boostObj?.parentTransactions ?? [];
};

/**
 * Determines if a given transaction was boosted via it's txid.
 * CURRENTLY UNUSED
 * @param {string} txid
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {boolean}
 */
export const isTransactionBoosted = ({
	txid,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): boolean => {
	if (!boostedTransactions) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	return txid in boostedTransactions;
};

/**
 * Determines if a given txid has any boosted parents.
 * @param {string} [txid]
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {boolean}
 */
export const hasBoostedParents = ({
	txid,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): boolean => {
	if (!boostedTransactions) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostedParents = getBoostedTransactionParents({
		txid,
		boostedTransactions,
	});
	return boostedParents.length > 0;
};

/**
 * Returns the initially boosted transaction's activity item for a given txid.
 * @param {string} [txid]
 * @param {IActivityItem[]} [items]
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {TOnchainActivityItem|undefined}
 */
export const getRootParentActivity = ({
	txid,
	items,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid: string;
	items: TOnchainActivityItem[];
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): TOnchainActivityItem | undefined => {
	if (!boostedTransactions) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostedParents = getBoostedTransactionParents({
		txid,
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
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {TOnchainActivityItem[]}
 */
export const formatBoostedActivityItems = ({
	items,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	items: TOnchainActivityItem[];
	boostedTransactions: IBoostedTransactions;
	selectedWallet: TWalletName;
	selectedNetwork: TAvailableNetworks;
}): TOnchainActivityItem[] => {
	const formattedItems: TOnchainActivityItem[] = [];

	items.forEach((item) => {
		const txid = item.id;

		// if boosted tx don't add for now
		if (item.id in boostedTransactions) {
			return;
		}

		const rootParent = getRootParentActivity({
			txid,
			items,
			boostedTransactions,
			selectedWallet,
			selectedNetwork,
		});

		// if we can't find a parent tx leave as is
		if (!rootParent) {
			formattedItems.push(item);
			return;
		}

		const parentBoostType = boostedTransactions[rootParent.txId].type;

		// if not a CPFP tx leave as is
		if (parentBoostType === EBoost.rbf) {
			formattedItems.push(item);
			return;
		}

		const value = calculateBoostTransactionValue({
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
			address: rootParent.address,
			timestamp: item.timestamp,
			isBoosted: true,
		});
	});

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
export const calculateBoostTransactionValue = ({
	currentActivityItem,
	items,
	boostedTransactions,
	includeFee = false,
}: {
	currentActivityItem: TOnchainActivityItem;
	items: TOnchainActivityItem[];
	boostedTransactions: IBoostedTransactions;
	includeFee?: boolean;
}): number => {
	const boostedTransaction = Object.values(boostedTransactions).find(
		(tx) => tx.childTransaction === currentActivityItem.id,
	);
	if (!boostedTransaction) {
		return currentActivityItem.value;
	}
	const rootParent = getRootParentActivity({
		txid: currentActivityItem.id,
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
			value = value - parent.fee;
		});
	}

	return value;
};
