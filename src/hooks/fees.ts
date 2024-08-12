import { useAppSelector } from '../hooks/redux';
import { onChainFeesSelector } from '../store/reselect/fees';
import { FeeText, TFeeText } from '../utils/fees';

/**
 * Returns the FeeText for a given fee amount.
 * @param {number} satsPerByte
 * @returns {TFeeText}
 */
export const useFeeText = (satsPerByte: number): TFeeText => {
	const feeEstimates = useAppSelector(onChainFeesSelector);

	let feeText = FeeText.none;

	if (satsPerByte >= feeEstimates.minimum) {
		feeText = FeeText.minimum;
	}
	if (satsPerByte >= feeEstimates.slow) {
		feeText = FeeText.slow;
	}
	if (satsPerByte >= feeEstimates.normal) {
		feeText = FeeText.normal;
	}
	if (satsPerByte >= feeEstimates.fast) {
		feeText = FeeText.fast;
	}

	return feeText;
};
