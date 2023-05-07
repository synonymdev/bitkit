declare module '@env' {
	export const ENABLE_REDUX_FLIPPER: string;
	export const ENABLE_REDUX_LOGGER: string;
	export const ENABLE_REDUX_IMMUTABLE_CHECK: string;
	export const ENABLE_MMKV_FLIPPER: string;
	export const ENABLE_I18NEXT_DEBUGGER: string;
	export const ENABLE_MIGRATION_DEBUG: string;

	export const BACKUPS_SHARED_SECRET: string;
	export const BACKUPS_SERVER_SLASHTAG: string;

	export const DISABLE_SLASHTAGS: string;
	export const SLASHTAGS_SEEDER_BASE_URL: string;
	export const SLASHTAGS_SEEDER_TOPIC: string;

	export const BLOCKTANK_HOST: string;

	export const ELECTRUM_BITCOIN_HOST: string;
	export const ELECTRUM_BITCOIN_SSL_PORT: number;
	export const ELECTRUM_BITCOIN_TCP_PORT: number;
	export const ELECTRUM_BITCOIN_PROTO: string;
	export const ELECTRUM_REGTEST_HOST: string;
	export const ELECTRUM_REGTEST_SSL_PORT: number;
	export const ELECTRUM_REGTEST_TCP_PORT: number;
	export const ELECTRUM_REGTEST_PROTO: string;

	export const WALLET_DEFAULT_SELECTED_NETWORK: string;

	export const DISABLE_PERIODIC_REMINDERS: string;
	export const DISABLE_ANIMATION: string;
}
