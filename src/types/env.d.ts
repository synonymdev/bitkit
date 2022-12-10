declare module '@env' {
	export const ENABLE_REDUX_FLIPPER: string;
	export const ENABLE_REDUX_LOGGER: string;
	export const ENABLE_REDUX_IMMUTABLE_CHECK: string;
	export const ENABLE_MMKV_FLIPPER: string;
	export const ENABLE_I18NEXT_DEBUGGER: string;
	export const ENABLE_MIGRATION_DEBUG: string;

	export const BACKUPS_SHARED_SECRET: string;
	export const BACKUPS_SERVER_SLASHTAG: string;

	export const SLASHTAGS_SEEDER_BASE_URL: string;
	export const SLASHTAGS_SEEDER_TOPIC: string;
}
