import { useEffect, useState } from 'react';
import { i18nTime } from '../utils/i18n';

type TBlocksWidgetData = {
	height: string;
	time: string;
	date: string;
	transactionCount: string;
	size: string;
	weight: string;
	difficulty: string;
	hash: string;
	merkleRoot: string;
};

enum EWidgetStatus {
	Loading = 'loading',
	Error = 'error',
	Ready = 'ready',
}

type LoadingState = {
	status: EWidgetStatus.Loading;
	data: null;
};

type ErrorState = {
	status: EWidgetStatus.Error;
	data: null;
};

type ReadyState = {
	status: EWidgetStatus.Ready;
	data: TBlocksWidgetData;
};

type TWidgetState = LoadingState | ErrorState | ReadyState;

const BASE_URL = 'https://mempool.space/api';
const REFRESH_INTERVAL = 1000 * 60 * 2; // 2 minutes

const formatBlockInfo = (blockInfo): TBlocksWidgetData => {
	const { format } = new Intl.NumberFormat('en-US');

	const difficulty = (blockInfo.difficulty / 1000000000000).toFixed(2);
	const size = Number((blockInfo.size / 1024).toFixed(2));
	const weight = Number((blockInfo.weight / 1024 / 1024).toFixed(2));

	const time = i18nTime.t('dateTime', {
		v: new Date(blockInfo.timestamp * 1000),
		formatParams: {
			v: {
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
			},
		},
	});

	const date = i18nTime.t('dateTime', {
		v: new Date(blockInfo.timestamp * 1000),
		formatParams: {
			v: {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			},
		},
	});

	const formattedHeight = format(blockInfo.height);
	const formattedSize = `${format(Math.trunc(size))} Kb`;
	const formattedTransactions = format(blockInfo.tx_count);
	const formattedWeight = `${format(weight)} MWU`;

	return {
		hash: blockInfo.id,
		difficulty,
		size: formattedSize,
		weight: formattedWeight,
		height: formattedHeight,
		time,
		date,
		transactionCount: formattedTransactions,
		merkleRoot: blockInfo.merkle_root,
	};
};

const useBlocksWidget = (): TWidgetState => {
	const [state, setState] = useState<TWidgetState>({
		status: EWidgetStatus.Loading,
		data: null,
	});

	useEffect(() => {
		const abortController = new AbortController();

		const fetchTipHash = async (): Promise<string> => {
			// Get the current tip height
			const response = await fetch(`${BASE_URL}/blocks/tip/hash`, {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.text();
		};

		const fetchBlockInfo = async (hash: string) => {
			// Get the block info for the current height
			const response = await fetch(`${BASE_URL}/block/${hash}`, {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		};

		const fetchData = async (): Promise<void> => {
			try {
				const hash = await fetchTipHash();
				const blockInfo = await fetchBlockInfo(hash);
				const formatted = formatBlockInfo(blockInfo);

				setState({ status: EWidgetStatus.Ready, data: formatted });
			} catch (error) {
				console.error('Failed to fetch block data:', error);
				setState({ status: EWidgetStatus.Error, data: null });
			}
		};

		fetchData();

		const interval = setInterval(fetchData, REFRESH_INTERVAL);

		return () => {
			clearInterval(interval);
			abortController.abort();
		};
	}, []);

	return state;
};

export default useBlocksWidget;
