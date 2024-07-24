import { getSelectedNetwork, getSelectedWallet } from './wallet';
import { EAvailableNetwork } from './networks';
import { getActivityStore, getWalletStore } from '../store/helpers';
import { IActivityItem, TOnchainActivityItem } from '../store/types/activity';
import { TWalletName } from '../store/types/wallet';
import { EBoostType, IBoostedTransactions } from 'beignet';

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
 * @param {string} txId
 * @param {IBoostedTransactions} [boostedTransactions]
 * @param {TWalletName} [selectedWallet]
 * @param {EAvailableNetwork} [selectedNetwork]
 * @returns {string[]}
 */
export const getBoostedTransactionParents = ({
	txId,
	boostedTransactions,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
	txId: string;
	boostedTransactions?: IBoostedTransactions;
	selectedWallet?: TWalletName;
	selectedNetwork?: EAvailableNetwork;
}): string[] => {
	if (!boostedTransactions) {
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostObj = Object.values(boostedTransactions).find((boostObject) => {
		return boostObject.childTransaction === txId;
	});

	return boostObj?.parentTransactions ?? [];
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
	txId,
	boostedTransactions,
	selectedWallet = getSelectedWallet(),
	selectedNetwork = getSelectedNetwork(),
}: {
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
export const getRootParentActivity = ({
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
}): TOnchainActivityItem | undefined => {
	if (!boostedTransactions) {
		boostedTransactions = getBoostedTransactions({
			selectedWallet,
			selectedNetwork,
		});
	}
	const boostedParents = getBoostedTransactionParents({
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
export const formatBoostedActivityItems = ({
	items,
	boostedTransactions,
	selectedWallet,
	selectedNetwork,
}: {
	items: TOnchainActivityItem[];
	boostedTransactions: IBoostedTransactions;
	selectedWallet: TWalletName;
	selectedNetwork: EAvailableNetwork;
}): TOnchainActivityItem[] => {
	const formattedItems: TOnchainActivityItem[] = [];

	items.forEach((item) => {
		const { txId } = item;

		// if boosted tx don't add for now
		if (txId in boostedTransactions) {
			return;
		}

		const rootParent = getRootParentActivity({
			txId,
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
		if (parentBoostType === EBoostType.rbf) {
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
			fee: rootParent.fee + item.fee,
			address: rootParent.address,
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
		(tx) => tx.childTransaction === currentActivityItem.txId,
	);
	if (!boostedTransaction) {
		return currentActivityItem.value;
	}
	const rootParent = getRootParentActivity({
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
