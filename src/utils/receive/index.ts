import { encode } from 'bip21';
import bitcoinUnits from 'bitcoin-units';

/**
 * Creates a BIP21 URI w/ Lightning PaymentRequest
 */
export const getUnifiedUri = ({
	address,
	amount,
	label,
	message,
	lightning = '',
}: {
	address: string;
	amount: number | string;
	label: string;
	message: string;
	lightning?: string;
}): string => {
	const amountBTC = bitcoinUnits(amount, 'satoshi')
		.to('btc')
		.value()
		// convert to string without scientific notation and trailing zeros
		.toFixed(10)
		.replace(/\.?0+$/, '');

	return encode(address, {
		// only attach non-empty params
		...(amount ? { amount: amountBTC } : {}),
		...(label !== '' ? { label } : {}),
		// do wallet apps still use "message"?
		...(message !== '' ? { message } : {}),
		...(lightning !== '' ? { lightning: lightning.toUpperCase() } : {}),
	});
};
