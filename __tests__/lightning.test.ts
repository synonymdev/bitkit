import { IBtInfo, IGetFeeEstimatesResponse } from 'beignet';
import { getFees } from '../src/utils/lightning';

jest.mock('../src/utils/wallet', () => ({
	getSelectedNetwork: jest.fn(() => 'bitcoin'),
}));

describe('getFees', () => {
	const MEMPOOL_URL = 'https://mempool.space/api/v1/fees/recommended';
	const BLOCKTANK_URL = 'https://api1.blocktank.to/api/info';

	const mockMempoolResponse: IGetFeeEstimatesResponse = {
		fastestFee: 111,
		halfHourFee: 110,
		hourFee: 109,
		minimumFee: 108,
	};

	const mockBlocktankResponse: IBtInfo = {
		onchain: {
			feeRates: {
				fast: 999,
				mid: 998,
				slow: 997,
			},
		},
	} as IBtInfo;

	beforeEach(() => {
		jest.clearAllMocks();
		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockMempoolResponse),
				});
			}
			if (url === BLOCKTANK_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockBlocktankResponse),
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});
	});

	it('should use mempool.space when both APIs succeed', async () => {
		const result = await getFees();

		expect(result).toEqual({
			onChainSweep: 111,
			maxAllowedNonAnchorChannelRemoteFee: Math.max(25, 111 * 10),
			minAllowedAnchorChannelRemoteFee: 108,
			minAllowedNonAnchorChannelRemoteFee: 107,
			anchorChannelFee: 109,
			nonAnchorChannelFee: 110,
			channelCloseMinimum: 108,
			outputSpendingFee: 111,
		});
		expect(fetch).toHaveBeenCalledTimes(2);
		expect(fetch).toHaveBeenCalledWith(MEMPOOL_URL);
		expect(fetch).toHaveBeenCalledWith(BLOCKTANK_URL);
	});

	it('should use blocktank when mempool.space fails', async () => {
		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL) {
				return Promise.reject('Mempool failed');
			}
			if (url === BLOCKTANK_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockBlocktankResponse),
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const result = await getFees();
		expect(result).toEqual({
			onChainSweep: 999,
			maxAllowedNonAnchorChannelRemoteFee: Math.max(25, 999 * 10),
			minAllowedAnchorChannelRemoteFee: 997,
			minAllowedNonAnchorChannelRemoteFee: 996,
			anchorChannelFee: 997,
			nonAnchorChannelFee: 998,
			channelCloseMinimum: 997,
			outputSpendingFee: 999,
		});
		expect(fetch).toHaveBeenCalledTimes(3);
	});

	it('should retry mempool once and succeed even if blocktank fails', async () => {
		let mempoolAttempts = 0;
		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL) {
				mempoolAttempts++;
				return mempoolAttempts === 1
					? Promise.reject('First mempool try failed')
					: Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockMempoolResponse),
					});
			}
			if (url === BLOCKTANK_URL) {
				return Promise.reject('Blocktank failed');
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const result = await getFees();
		expect(result.onChainSweep).toBe(111);
		expect(fetch).toHaveBeenCalledTimes(4);
		expect(fetch).toHaveBeenCalledWith(MEMPOOL_URL);
		expect(fetch).toHaveBeenCalledWith(BLOCKTANK_URL);
	});

	it('should throw error when all fetches fail', async () => {
		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL || url === BLOCKTANK_URL) {
				return Promise.reject('API failed');
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		await expect(getFees()).rejects.toThrow();
		expect(fetch).toHaveBeenCalledTimes(4);
	});

	it('should handle invalid mempool response', async () => {
		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ fastestFee: 0 }),
				});
			}
			if (url === BLOCKTANK_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockBlocktankResponse),
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const result = await getFees();
		expect(result.onChainSweep).toBe(999);
	});

	it('should handle invalid blocktank response', async () => {
		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockMempoolResponse),
				});
			}
			if (url === BLOCKTANK_URL) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ onchain: { feeRates: { fast: 0 } } }),
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const result = await getFees();
		expect(result.onChainSweep).toBe(111);
	});

	it('should handle timeout errors gracefully', async () => {
		jest.useFakeTimers();

		(global.fetch as jest.Mock) = jest.fn(url => {
			if (url === MEMPOOL_URL) {
				return new Promise(resolve => {
					setTimeout(() => resolve({
						ok: true,
						json: () => Promise.resolve(mockMempoolResponse),
					}), 15000); // longer than timeout
				});
			}
			if (url === BLOCKTANK_URL) {
				return new Promise(resolve => {
					setTimeout(() => resolve({
						ok: true,
						json: () => Promise.resolve(mockBlocktankResponse),
					}), 15000); // longer than timeout
				});
			}
			return Promise.reject(new Error(`Unexpected URL: ${url}`));
		});

		const feesPromise = getFees();

		jest.advanceTimersByTime(11000);

		await expect(feesPromise).rejects.toThrow();
		expect(fetch).toHaveBeenCalledTimes(2);

		jest.useRealTimers();
	});
});

