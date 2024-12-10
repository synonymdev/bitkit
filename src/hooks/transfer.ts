import { useAppSelector } from './redux';
import { onChainBalanceSelector } from '../store/reselect/wallet';
import { blocktankInfoSelector } from '../store/reselect/blocktank';
import { blocktankChannelsSizeSelector } from '../store/reselect/lightning';
import { fiatToBitcoinUnit } from '../utils/conversion';

type TTransferValues = {
	maxClientBalance: number;
	defaultLspBalance: number;
	minLspBalance: number;
	maxLspBalance: number;
};

const getDefaultLspBalance = (
	clientBalance: number,
	maxLspBalance: number,
): number => {
	const threshold1 = fiatToBitcoinUnit({ amount: 225, currency: 'EUR' });
	const threshold2 = fiatToBitcoinUnit({ amount: 495, currency: 'EUR' });
	const defaultLspBalance = fiatToBitcoinUnit({ amount: 450, currency: 'EUR' });

	let lspBalance = defaultLspBalance - clientBalance;

	if (clientBalance > threshold1) {
		lspBalance = clientBalance;
	}

	if (clientBalance > threshold2) {
		lspBalance = maxLspBalance;
	}

	return Math.min(lspBalance, maxLspBalance);
};

const getMinLspBalance = (
	clientBalance: number,
	minChannelSize: number,
): number => {
	// LSP balance must be at least 2% of the channel size for LDK to accept (reserve balance)
	const ldkMinimum = Math.round(clientBalance * 0.02);
	// Channel size must be at least minChannelSize
	const lspMinimum = Math.max(minChannelSize - clientBalance, 0);

	return Math.max(ldkMinimum, lspMinimum);
};

const getMaxClientBalance = (
	onchainBalance: number,
	maxChannelSize: number,
): number => {
	// Remote balance must be at least 2% of the channel size for LDK to accept (reserve balance)
	const minRemoteBalance = Math.round(maxChannelSize * 0.02);
	// Cap client balance to 80% to leave buffer for fees
	const feeMaximum = Math.round(onchainBalance * 0.8);
	const ldkMaximum = maxChannelSize - minRemoteBalance;

	return Math.min(feeMaximum, ldkMaximum);
};

/**
 * Returns limits and default values for channel orders with the LSP
 * @param {number} clientBalance
 * @returns {TTransferValues}
 */
export const useTransfer = (clientBalance: number): TTransferValues => {
	const blocktankInfo = useAppSelector(blocktankInfoSelector);
	const onchainBalance = useAppSelector(onChainBalanceSelector);
	const channelsSize = useAppSelector(blocktankChannelsSizeSelector);

	const { minChannelSizeSat, maxChannelSizeSat } = blocktankInfo.options;

	// Because LSP limits constantly change depending on network fees
	// add a 2% buffer to avoid fluctuations while making the order
	const maxChannelSize1 = Math.round(maxChannelSizeSat * 0.98);
	// The maximum channel size the user can open including existing channels
	const maxChannelSize2 = Math.max(0, maxChannelSize1 - channelsSize);
	const maxChannelSize = Math.min(maxChannelSize1, maxChannelSize2);

	const minLspBalance = getMinLspBalance(clientBalance, minChannelSizeSat);
	const maxLspBalance = maxChannelSize - clientBalance;
	const defaultLspBalance = getDefaultLspBalance(clientBalance, maxLspBalance);
	const maxClientBalance = getMaxClientBalance(onchainBalance, maxChannelSize);

	return {
		defaultLspBalance,
		minLspBalance,
		maxLspBalance,
		maxClientBalance,
	};
};
