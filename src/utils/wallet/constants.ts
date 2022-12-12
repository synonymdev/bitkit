export const BITKIT_WALLET_SEED_HASH_PREFIX = Buffer.from(
	'@Bitkit/wallet-uuid',
);

//How many addresses to generate when more are needed.
export const GENERATE_ADDRESS_AMOUNT = 5;

// TODO: Add this as a settings for users to adjust when needed.
export const GAP_LIMIT = 20;

// TODO: remove chunk logic and move it to rn-electrum library
export const CHUNK_LIMIT = 15;

//How much of the users funds we allow to be used for Lightning.
export const SPENDING_LIMIT_RATIO = 1.2;
