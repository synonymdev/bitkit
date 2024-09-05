export const BITKIT_WALLET_SEED_HASH_PREFIX = Buffer.from(
	'@Bitkit/wallet-uuid',
);

export const TRANSACTION_DEFAULTS = {
	recommendedBaseFee: 256, // Total recommended tx base fee in sats
	dustLimit: 546, // Minimum value in sats for an output. Outputs below the dust limit may not be processed because the fees required to include them in a block would be greater than the value of the transaction itself.
};

// Default duration before a channel is closed by the LSP (in weeks)
export const DEFAULT_CHANNEL_DURATION = 6;
