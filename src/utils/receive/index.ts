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
	lightning,
}: {
	address: string;
	amount: number | string;
	label: string;
	message: string;
	lightning: string;
}): string => {
	const amountBTC = bitcoinUnits(amount, 'satoshi').to('btc').value();

	return encode(address, {
		// only attach non-empty params
		...(amountBTC ? { amount: amountBTC } : {}),
		...(label !== '' ? { label } : {}),
		// do wallet apps still use "message"?
		...(message !== '' ? { message } : {}),
		...(lightning !== '' ? { lightning: lightning.toUpperCase() } : {}),
	});
};
