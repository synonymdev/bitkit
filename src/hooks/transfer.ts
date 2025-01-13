import { useEffect, useState } from 'react';

import { blocktankInfoSelector } from '../store/reselect/blocktank';
import { blocktankChannelsSizeSelector } from '../store/reselect/lightning';
import { estimateOrderFee } from '../utils/blocktank';
import { fiatToBitcoinUnit } from '../utils/conversion';
import { useAppSelector } from './redux';

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
	// LSP balance must be at least 2.5% of the channel size for LDK to accept (reserve balance)
	const ldkMinimum = Math.round(clientBalance * 0.025);
	// Channel size must be at least minChannelSize
	const lspMinimum = Math.max(minChannelSize - clientBalance, 0);

	return Math.max(ldkMinimum, lspMinimum);
};

const getMaxClientBalance = (maxChannelSize: number): number => {
	// Remote balance must be at least 2.5% of the channel size for LDK to accept (reserve balance)
	const minRemoteBalance = Math.round(maxChannelSize * 0.025);
	return maxChannelSize - minRemoteBalance;
};

/**
 * Returns limits and default values for channel orders with the LSP
 * @param {number} clientBalance
 * @returns {TTransferValues}
 */
export const useTransfer = (clientBalance: number): TTransferValues => {
	const blocktankInfo = useAppSelector(blocktankInfoSelector);
	const channelsSize = useAppSelector(blocktankChannelsSizeSelector);

	const { minChannelSizeSat, maxChannelSizeSat } = blocktankInfo.options;

	// Because LSP limits constantly change depending on network fees
	// add a 2% buffer to avoid fluctuations while making the order
	const maxChannelSize1 = Math.round(maxChannelSizeSat * 0.98);
	// The maximum channel size the user can open including existing channels
	const maxChannelSize2 = Math.max(0, maxChannelSize1 - channelsSize);
	const maxChannelSize = Math.min(maxChannelSize1, maxChannelSize2);

	const minLspBalance = getMinLspBalance(clientBalance, minChannelSizeSat);
	const maxLspBalance = Math.max(maxChannelSize - clientBalance, 0);
	const defaultLspBalance = getDefaultLspBalance(clientBalance, maxLspBalance);
	const maxClientBalance = getMaxClientBalance(maxChannelSize);

	return {
		defaultLspBalance,
		minLspBalance,
		maxLspBalance,
		maxClientBalance,
	};
};

/**
 * Returns limits and default values for channel orders with the LSP
 * @param {number} lspBalance
 * @param {number} clientBalance
 * @returns {{ fee: number, loading: boolean, error: string | null }}
 */
export const useTransferFee = (
	lspBalance: number,
	clientBalance: number,
): { fee: number; loading: boolean; error: string | null } => {
	const [{ fee, loading, error }, setState] = useState<{
		fee: number;
		loading: boolean;
		error: string | null;
	}>({
		fee: 0,
		loading: true,
		error: null,
	});

	useEffect(() => {
		const getFeeEstimation = async (): Promise<void> => {
			setState((prevState) => ({ ...prevState, loading: true }));
			try {
				const result = await estimateOrderFee({ lspBalance, clientBalance });
				if (result.isOk()) {
					const { feeSat } = result.value;
					setState({ fee: feeSat, loading: false, error: null });
				} else {
					setState({ fee: 0, loading: false, error: result.error.message });
				}
			} catch (err) {
				setState({ fee: 0, loading: false, error: err });
			}
		};

		getFeeEstimation();
	}, [lspBalance, clientBalance]);

	return { fee, loading, error };
};
