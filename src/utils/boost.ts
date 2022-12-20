import { getSelectedNetwork, getSelectedWallet } from './wallet';
import { getActivityStore, getWalletStore } from '../store/helpers';
import {
	EBoost,
	IBoostedTransaction,
	TWalletName,
} from '../store/types/wallet';
import { TAvailableNetworks } from './networks';
import { EActivityTypes, IActivityItem } from '../store/types/activity';
import { defaultActivityItemShape } from '../store/shapes/activity';

/**
 * Returns boosted transactions object.
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {IBoostedTransaction}
 */
export const getBoostedTransactions = ({
	selectedWallet,
	selectedNetwork,
}: {
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): IBoostedTransaction => {
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
 * @param {IBoostedTransaction} [boostedTransactions]
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
	boostedTransactions?: IBoostedTransaction;
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
	const boostObj = Object.values(boostedTransactions).filter((boostObject) => {
		return boostObject.childTransaction === txid;
	});
	if (boostObj.length) {
		return boostObj[0]?.parentTransactions ?? [];
	}
	return [];
};

/**
 * Determines if a given transaction was boosted via it's txid.
 * @param {string} [txid]
 * @param {IBoostedTransaction} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {boolean}
 */
export const isTransactionBoosted = ({
	txid = '',
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid?: string;
	boostedTransactions?: IBoostedTransaction;
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
 * @param {IBoostedTransaction} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 * @returns {boolean}
 */
export const hasBoostedParents = ({
	txid = '',
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid?: string;
	boostedTransactions?: IBoostedTransaction;
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
 * @param {IBoostedTransaction} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const getRootParentActivity = ({
	txid = '',
	items = [],
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	txid?: string;
	items?: IActivityItem[];
	boostedTransactions?: IBoostedTransaction;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): IActivityItem | undefined => {
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
	const filteredItem = items.filter((i) => i.id === boostedParents[0]);
	if (!filteredItem.length) {
		return undefined;
	}
	return filteredItem[0];
};

/**
 * Returns an array of activity items for the provided array of parent txids.
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
 * This method will parse through and re-calculate boosted transaction values.
 * @param {IActivityItem[]} [items]
 * @param {IBoostedTransaction} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {TAvailableNetworks} [selectedNetwork]
 */
export const formatBoostedActivityItems = ({
	items = [],
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	items?: IActivityItem[];
	boostedTransactions?: IBoostedTransaction;
	selectedWallet?: TWalletName;
	selectedNetwork?: TAvailableNetworks;
}): IActivityItem[] => {
	let activityItems: IActivityItem[] = [];
	if (!boostedTransactions || !items) {
		if (!selectedWallet) {
			selectedWallet = getSelectedWallet();
		}
		if (!selectedNetwork) {
			selectedNetwork = getSelectedNetwork();
		}
		if (!boostedTransactions) {
			boostedTransactions = getBoostedTransactions({
				selectedWallet,
				selectedNetwork,
			});
		}
		if (!items) {
			items = getActivityStore().items;
		}
	}
	items.map((currentActivityItem) => {
		if (currentActivityItem.activityType !== EActivityTypes.onChain) {
			activityItems.push(currentActivityItem);
			return;
		}
		// @ts-ignore
		if (currentActivityItem.id in boostedTransactions) {
			return;
		}
		const txid = currentActivityItem.id;
		const rootParent = getRootParentActivity({
			txid,
			items,
			boostedTransactions,
			selectedWallet,
			selectedNetwork,
		});

		if (!rootParent?.id) {
			activityItems.push(currentActivityItem);
			return;
		}

		// @ts-ignore
		const parentBoostType = boostedTransactions[rootParent.id].type;

		if (parentBoostType === EBoost.rbf) {
			activityItems.push(currentActivityItem);
			return;
		}
		const value = calculateBoostTransactionValue({
			currentActivityItem,
			items,
			// @ts-ignore
			boostedTransactions,
		});
		activityItems.push({
			...defaultActivityItemShape,
			...currentActivityItem,
			value,
			txType: rootParent.txType,
			message: rootParent.message,
			address: rootParent.address,
			timestamp: currentActivityItem.timestamp,
		});
	});
	return activityItems;
};

/**
 * Returns the end value of a series of boost transactions.
 * @param {IActivityItem} currentActivityItem
 * @param {string[]} parents
 * @param {IActivityItem[]} items
 * @param {IBoostedTransaction} boostedTransactions
 */
export const calculateBoostTransactionValue = ({
	currentActivityItem,
	items,
	boostedTransactions,
}: {
	currentActivityItem: IActivityItem;
	items: IActivityItem[];
	boostedTransactions: IBoostedTransaction;
}): number => {
	const boostedTransaction = Object.values(boostedTransactions).filter(
		(bt) => bt.childTransaction === currentActivityItem.id,
	);
	if (!boostedTransaction.length) {
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
	const parents = boostedTransaction[0].parentTransactions;
	// Subtract fee root value using each parent fee.
	parents.forEach((parentTxid) => {
		const parent = boostedTransactions[parentTxid];
		value = value - parent.fee;
	});
	return value;
};
