import { useEffect, useState } from 'react';
import { __E2E__ } from '../constants/env';
import { tradingPairs } from '../constants/widgets';
import { widgetsCache } from '../storage/widgets-cache';
import { TGraphPeriod } from '../store/types/widgets';
import { IThemeColors } from '../styles/themes';

type TradingPair = {
	name: string;
	base: string;
	quote: string;
	symbol: string;
};

type TPrice = {
	price: number;
	timestamp: number;
};

type TCandle = {
	timestamp: number;
	open: number;
	close: number;
	high: number;
	low: number;
	volume: number;
};

type Change = {
	color: keyof IThemeColors;
	formatted: string;
};

type TWidgetData = {
	name: string;
	change: Change;
	price: string;
	pastValues: number[];
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
	data: TWidgetData[];
};

type TWidgetState = LoadingState | ErrorState | ReadyState;

const BASE_URL = 'https://feeds.synonym.to/price-feed/api';
const REFRESH_INTERVAL = 1000 * 60; // 1 minute

const getChange = (pastValues: number[]): Change => {
	if (pastValues.length < 2) {
		return { color: 'green', formatted: '+0%' };
	}

	const change = pastValues[pastValues.length - 1] / pastValues[0] - 1;
	const sign = change >= 0 ? '+' : '';
	const color = change >= 0 ? 'green' : 'red';

	return {
		color,
		formatted: `${sign}${(change * 100).toFixed(2)}%`,
	};
};

export const formatPrice = (pair: TradingPair, price: number): string => {
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: pair.quote,
		})
			.formatToParts(price)
			.filter((part) => ['currency', 'integer', 'group'].includes(part.type))
			.map((part) => part.value)
			.join('');
	} catch (error) {
		console.error('Error formatting price:', error);
		return String(price);
	}
};

const cacheData = (
	pairName: string,
	period: TGraphPeriod,
	data: TWidgetData,
) => {
	const cacheKey = `${pairName}_${period}`;
	widgetsCache.set(cacheKey, data);
};

const getCachedData = (
	pairs: string[],
	period: TGraphPeriod,
): TWidgetData[] | null => {
	const data = pairs.map((pairName) => {
		const cacheKey = `${pairName}_${period}`;
		const cached = widgetsCache.get<TWidgetData>(cacheKey);
		return cached;
	});

	const allCached = data.every((d) => d !== null);
	if (allCached) {
		return data;
	}

	return null;
};

const usePriceWidget = (
	pairs: string[],
	period: TGraphPeriod,
): TWidgetState => {
	const [state, setState] = useState<TWidgetState>(() => {
		const cached = getCachedData(pairs, period);
		return cached
			? { status: EWidgetStatus.Ready, data: cached }
			: { status: EWidgetStatus.Loading, data: null };
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: pairs is an array so deep check it
	useEffect(() => {
		const abortController = new AbortController();
		let intervalId: NodeJS.Timeout | null = null;

		const fetchPrice = async (ticker: string): Promise<number> => {
			const response = await fetch(`${BASE_URL}/price/${ticker}/latest`, {
				signal: abortController.signal,
			});
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const data = (await response.json()) as TPrice;
			return data.price;
		};

		const fetchCandles = async (ticker: string): Promise<TCandle[]> => {
			const response = await fetch(
				`${BASE_URL}/price/${ticker}/history/${period}`,
				{
					signal: abortController.signal,
				},
			);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.json();
		};

		const setupPriceTracking = async (): Promise<void> => {
			try {
				const promises = pairs.map(async (pairName) => {
					const pair = tradingPairs.find((p) => p.name === pairName)!;
					const ticker = `${pair.base}${pair.quote}`;
					const candles = await fetchCandles(ticker);
					const sorted = candles.sort((a, b) => a.timestamp - b.timestamp);
					const pastValues = sorted.map((candle) => candle.close);
					// Replace last value of pastValues with the latest price
					const latestPrice = await fetchPrice(ticker);
					const updatedPastValues = [...pastValues.slice(0, -1), latestPrice];
					const change = getChange(updatedPastValues);
					const price = formatPrice(pair, latestPrice);

					const data = {
						name: pairName,
						price,
						change,
						pastValues: updatedPastValues,
					};

					cacheData(pairName, period, data);

					return data;
				});
				const data = await Promise.all(promises);
				setState({ status: EWidgetStatus.Ready, data });

				// Don't start polling in E2E tests
				if (__E2E__) {
					return;
				}

				// Start polling for updates
				intervalId = setInterval(async () => {
					try {
						const updatedData = await Promise.all(
							data.map(async (pairData) => {
								const pair = tradingPairs.find(
									(p) => p.name === pairData.name,
								)!;
								const ticker = `${pair.base}${pair.quote}`;
								const latestPrice = await fetchPrice(ticker);
								// Replace last value of pastValues with the latest price
								const newPastValues = [
									...pairData.pastValues.slice(0, -1),
									latestPrice,
								];
								const change = getChange(newPastValues);
								const price = formatPrice(pair, latestPrice);

								const data = {
									...pairData,
									price,
									change,
									pastValues: newPastValues,
								};

								cacheData(pairData.name, period, data);

								return data;
							}),
						);
						setState({ status: EWidgetStatus.Ready, data: updatedData });
					} catch (error) {
						console.error('Failed to fetch latest prices:', error);
					}
				}, REFRESH_INTERVAL);
			} catch (error) {
				console.error('Failed to fetch price data:', error);
				setState({ status: EWidgetStatus.Error, data: null });
			}
		};

		setupPriceTracking();

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
			abortController.abort();
		};
	}, [JSON.stringify(pairs), period]);

	return state;
};

export default usePriceWidget;
