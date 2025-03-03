import { useEffect, useState } from 'react';
import { __E2E__ } from '../constants/env';
import { widgetsCache } from '../storage/widgets-cache';
import { refreshOnchainFeeEstimates } from '../store/utils/fees';
import { getDisplayValues, getFiatDisplayValues } from '../utils/displayValues';

type TBlockFeeRates = {
	avgHeight: number;
	timestamp: number;
	avgFee_0: number;
	avgFee_10: number;
	avgFee_25: number;
	avgFee_50: number;
	avgFee_75: number;
	avgFee_90: number;
	avgFee_100: number;
};

enum EFeeCondition {
	Good = 'good',
	Average = 'average',
	Poor = 'poor',
}

type TWidgetData = {
	condition: EFeeCondition;
	currentFee: string;
	nextBlockFee: number;
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
	data: TWidgetData;
};

type TWidgetState = LoadingState | ErrorState | ReadyState;

const BASE_URL = 'https://mempool.space/api/v1';
const REFRESH_INTERVAL = 1000 * 60 * 2; // 2 minutes
const VBYTES_SIZE = 140; // average native segwit transaction size
const USD_GOOD_THRESHOLD = 1; // $1 USD threshold for good condition
const PERCENTILE_LOW = 0.33;
const PERCENTILE_HIGH = 0.66;
const CACHE_KEY = 'weather';

const cacheData = (data: TWidgetData) => {
	widgetsCache.set(CACHE_KEY, data);
};

const getCachedData = (): TWidgetData | null => {
	return widgetsCache.get<TWidgetData>(CACHE_KEY);
};

const calculateCondition = (
	currentFeeRate: number,
	history: { avgFee_50: number }[],
) => {
	if (!history.length) {
		// Default fallback if no historical data
		return EFeeCondition.Average;
	}

	const historical = history.map((block) => block.avgFee_50);
	// Sort fees in ascending order
	const sorted = historical.sort((a, b) => a - b);

	// Calculate percentiles
	const lowThreshold = sorted[Math.floor(sorted.length * PERCENTILE_LOW)];
	const highThreshold = sorted[Math.floor(sorted.length * PERCENTILE_HIGH)];

	const avgFee = currentFeeRate * VBYTES_SIZE;
	const { fiatValue: avgFeeUsd } = getFiatDisplayValues({
		satoshis: avgFee,
		currency: 'USD',
	});

	if (avgFeeUsd <= USD_GOOD_THRESHOLD) {
		return EFeeCondition.Good;
	}

	// Determine status based on current fee relative to percentiles
	if (currentFeeRate <= lowThreshold) {
		return EFeeCondition.Good;
	}

	if (currentFeeRate >= highThreshold) {
		return EFeeCondition.Poor;
	}

	return EFeeCondition.Average;
};

const useWeatherWidget = (): TWidgetState => {
	const [state, setState] = useState<TWidgetState>(() => {
		const cached = getCachedData();
		return cached
			? { status: EWidgetStatus.Ready, data: cached }
			: { status: EWidgetStatus.Loading, data: null };
	});

	useEffect(() => {
		const abortController = new AbortController();

		const fetchHistory = async (): Promise<TBlockFeeRates[]> => {
			// Get historical fee data for the last 3 months
			const response = await fetch(`${BASE_URL}/mining/blocks/fee-rates/3m`, {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		};

		const fetchData = async () => {
			try {
				const [feesResult, history] = await Promise.all([
					refreshOnchainFeeEstimates({ forceUpdate: true }),
					fetchHistory(),
				]);

				if (feesResult.isErr()) {
					setState({ status: EWidgetStatus.Error, data: null });
					return;
				}

				const fees = feesResult.value;
				const condition = calculateCondition(fees.normal, history);

				// Total fee based on average native segwit transaction of 140 vBytes
				const avgFee = fees.normal * VBYTES_SIZE;
				const dv = getDisplayValues({ satoshis: avgFee });
				const currentFee = `${dv.fiatSymbol} ${dv.fiatFormatted}`;
				const data = { condition, currentFee, nextBlockFee: fees.fast };

				cacheData(data);
				setState({ status: EWidgetStatus.Ready, data });
			} catch (error) {
				console.error('Failed to fetch fee data:', error);
				setState({ status: EWidgetStatus.Error, data: null });
			}
		};

		fetchData();

		// Don't start polling in E2E tests
		if (__E2E__) {
			return;
		}

		const interval = setInterval(fetchData, REFRESH_INTERVAL);

		return () => {
			clearInterval(interval);
			abortController.abort();
		};
	}, []);

	return state;
};

export default useWeatherWidget;
