declare module '@env' {
	export const BACKEND_HOST: string;
	export const BACKUPS_SERVER_HOST: string;
	export const BACKUPS_SERVER_PUBKEY: string;
	export const BLOCKTANK_HOST: string;

	export const DEFAULT_BITCOIN_NETWORK: string;

	export const ELECTRUM_REGTEST_HOST: string;
	export const ELECTRUM_REGTEST_SSL_PORT: number;
	export const ELECTRUM_REGTEST_TCP_PORT: number;
	export const ELECTRUM_REGTEST_PROTO: string;

	export const WEB_RELAY: string;
	export const TREASURE_HUNT_HOST: string;
	export const CHATWOOT_API: string;

	export const ENABLE_REDUX_LOGGER: string;
	export const ENABLE_REDUX_IMMUTABLE_CHECK: string;
	export const ENABLE_I18NEXT_DEBUGGER: string;
	export const ENABLE_MIGRATION_DEBUG: string;
	export const ENABLE_LDK_LOGS: string;
	export const E2E: string;
}
