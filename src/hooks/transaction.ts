import { useSelector } from 'react-redux';
import Store from '../store/types';
import {
	defaultBitcoinTransactionData,
	IAddressContent,
	IBitcoinTransactionData,
} from '../store/types/wallet';
import { reduceValue } from '../utils/helpers';
import { EFeeIds } from '../store/types/fees';
import {
	selectedNetworkSelector,
	selectedWalletSelector,
} from '../store/reselect/wallet';

/**
 * Current transaction object of the selectedWallet/Network.
 */
export function useTransactionDetails(): IBitcoinTransactionData {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const transaction = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.transaction[selectedNetwork] ||
			defaultBitcoinTransactionData,
	);

	return transaction;
}

export function useBalance(): number {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const transaction = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.transaction[selectedNetwork],
	);

	const balance = reduceValue({
		arr: transaction?.inputs ?? [],
		value: 'value',
	});
	if (balance.isOk()) {
		return balance.value;
	}

	return 0;
}

export function useChangeAddress(): IAddressContent {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);

	const changeAddress = useSelector(
		(store: Store) =>
			store.wallet.wallets[selectedWallet]?.changeAddressIndex[selectedNetwork]
				?.address || ' ',
	);

	return changeAddress;
}

/**
 * Returns the selected fee id from the fee picker for the current transaction.
 */
export function useSelectedFeeId(): EFeeIds {
	const selectedWallet = useSelector(selectedWalletSelector);
	const selectedNetwork = useSelector(selectedNetworkSelector);
	return useSelector(
		(store: Store) =>
			store?.wallet?.wallets[selectedWallet]?.transaction[selectedNetwork]
				?.selectedFeeId ?? EFeeIds.none,
	);
}
