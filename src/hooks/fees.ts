import { useSelector } from 'react-redux';
import { FeeText, TFeeText } from '../store/shapes/fees';
import Store from '../store/types';

/**
 * Returns the FeeText for a given fee amount.
 * @param {number} satsPerByte
 * @returns {TFeeText}
 */
export const useFeeText = (satsPerByte: number): TFeeText => {
	const feeEstimates = useSelector((store: Store) => store.fees.onchain);

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
