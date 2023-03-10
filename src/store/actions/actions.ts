const actions = {
	// Root
	WIPE_APP: 'WIPE_APP',

	// UI
	UPDATE_UI: 'UPDATE_UI',
	SHOW_SHEET: 'SHOW_SHEET',
	CLOSE_SHEET: 'CLOSE_SHEET',
	SET_APP_UPDATE_TYPE: 'SET_APP_UPDATE_TYPE',
	UPDATE_PROFILE_LINK: 'UPDATE_PROFILE_LINK',
	RESET_UI_STORE: 'RESET_UI_STORE',

	// User
	UPDATE_USER: 'UPDATE_USER',
	IGNORE_APP_UPDATE: 'IGNORE_APP_UPDATE',
	IGNORE_BACKUP: 'IGNORE_BACKUP',
	IGNORE_HIGH_BALANCE: 'IGNORE_HIGH_BALANCE',
	START_COOP_CLOSE_TIMER: 'START_COOP_CLOSE_TIMER',
	VERIFY_BACKUP: 'VERIFY_BACKUP',
	RESET_USER_STORE: 'RESET_USER_STORE',

	// Wallet
	UPDATE_WALLET: 'UPDATE_WALLET',
	UPDATE_HEADER: 'UPDATE_HEADER',
	UPDATE_WALLET_BALANCE: 'UPDATE_WALLET_BALANCE',
	CREATE_WALLET: 'CREATE_WALLET',
	RESET_WALLET_STORE: 'RESET_WALLET_STORE',
	RESET_SELECTED_WALLET: 'RESET_SELECTED_WALLET',
	RESET_EXCHANGE_RATES: 'RESET_EXCHANGE_RATES',
	SETUP_ON_CHAIN_TRANSACTION: 'SETUP_ON_CHAIN_TRANSACTION',
	UPDATE_ON_CHAIN_TRANSACTION: 'UPDATE_ON_CHAIN_TRANSACTION',
	DELETE_ON_CHAIN_TRANSACTION: 'DELETE_ON_CHAIN_TRANSACTION',
	RESET_ON_CHAIN_TRANSACTION: 'RESET_ON_CHAIN_TRANSACTION',
	ADD_BOOSTED_TRANSACTION: 'ADD_BOOSTED_TRANSACTION',
	UPDATE_ADDRESS_INDEX: 'UPDATE_ADDRESS_INDEX',
	UPDATE_SELECTED_ADDRESS_TYPE: 'UPDATE_SELECTED_ADDRESS_TYPE',
	ADD_ADDRESSES: 'ADD_ADDRESSES',
	UPDATE_UTXOS: 'UPDATE_UTXOS',
	UPDATE_TRANSACTIONS: 'UPDATE_TRANSACTIONS',

	// Receive
	UPDATE_INVOICE: 'UPDATE_INVOICE',
	DELETE_INVOICE_TAG: 'DELETE_INVOICE_TAG',
	RESET_INVOICE: 'RESET_INVOICE',

	// Lightning
	UPDATE_LIGHTNING: 'UPDATE_LIGHTNING',
	UPDATE_LIGHTNING_NODE_ID: 'UPDATE_LIGHTNING_NODE_ID',
	UPDATE_LIGHTNING_CHANNELS: 'UPDATE_LIGHTNING_CHANNELS',
	UPDATE_LIGHTNING_NODE_VERSION: 'UPDATE_LIGHTNING_NODE_VERSION',
	ADD_LIGHTNING_INVOICE: 'ADD_LIGHTNING_INVOICE',
	REMOVE_LIGHTNING_INVOICE: 'REMOVE_LIGHTNING_INVOICE',
	ADD_LIGHTNING_PAYMENT: 'ADD_LIGHTNING_PAYMENT',
	REMOVE_EXPIRED_LIGHTNING_INVOICES: 'REMOVE_EXPIRED_LIGHTNING_INVOICES',
	SAVE_LIGHTNING_PEER: 'SAVE_LIGHTNING_PEER',
	REMOVE_LIGHTNING_PEER: 'REMOVE_LIGHTNING_PEER',
	UPDATE_CLAIMABLE_BALANCE: 'UPDATE_CLAIMABLE_BALANCE',
	RESET_LIGHTNING_STORE: 'RESET_LIGHTNING_STORE',

	// Activity
	UPDATE_ACTIVITY_ENTRIES: 'UPDATE_ACTIVITY_ENTRIES',
	ADD_ACTIVITY_ITEM: 'ADD_ACTIVITY_ITEM',
	UPDATE_ACTIVITY_ITEM: 'UPDATE_ACTIVITY_ITEM',
	RESET_ACTIVITY_STORE: 'RESET_ACTIVITY_STORE',

	// Backup
	BACKUP_UPDATE: 'BACKUP_UPDATE',
	RESET_BACKUP_STORE: 'RESET_BACKUP_STORE',

	// Blocktank
	UPDATE_BLOCKTANK_SERVICE_LIST: 'UPDATE_BLOCKTANK_SERVICE_LIST',
	UPDATE_BLOCKTANK_ORDER: 'UPDATE_BLOCKTANK_ORDER',
	UPDATE_BLOCKTANK_INFO: 'UPDATE_BLOCKTANK_INFO',
	ADD_PAID_BLOCKTANK_ORDER: 'ADD_PAID_BLOCKTANK_ORDER',
	RESET_BLOCKTANK_STORE: 'RESET_BLOCKTANK_STORE',

	// Todos
	ADD_TODO: 'ADD_TODO',
	REMOVE_TODO: 'REMOVE_TODO',
	RESET_TODOS: 'RESET_TODOS',

	// Fees
	UPDATE_FEES: 'UPDATE_FEES',
	UPDATE_ONCHAIN_FEE_ESTIMATES: 'UPDATE_ONCHAIN_FEE_ESTIMATES',
	RESET_FEES_STORE: 'RESET_FEES_STORE',

	// Metadata
	UPDATE_META_TX_TAGS: 'UPDATE_META_TX_TAGS',
	ADD_META_TX_TAG: 'ADD_META_TX_TAG',
	DELETE_META_TX_TAG: 'DELETE_META_TX_TAG',
	ADD_META_TX_SLASH_TAGS_URL: 'ADD_META_TX_SLASH_TAGS_URL',
	DELETE_META_TX_SLASH_TAGS_URL: 'DELETE_META_TX_SLASH_TAGS_URL',
	UPDATE_META_INC_TX_TAGS: 'UPDATE_META_INC_TX_TAGS',
	ADD_META_INC_TX_TAG: 'ADD_META_INC_TX_TAG',
	DELETE_META_INC_TX_TAG: 'DELETE_META_INC_TX_TAG',
	MOVE_META_INC_TX_TAG: 'MOVE_META_INC_TX_TAG',
	RESET_META_STORE: 'RESET_META_STORE',
	ADD_TAG: 'ADD_TAG',
	DELETE_TAG: 'DELETE_TAG',
	UPDATE_META: 'UPDATE_META',

	// Contacts
	SET_ONBOARDING_PROFILE_STEP: 'SET_ONBOARDING_PROFILE_STEP',
	SET_VISITED_CONTACTS: 'SET_VISITED_CONTACTS',
	SET_LAST_SEEDER_REQUEST: 'SET_LAST_SEEDER_REQUEST',
	SET_LINKS: 'SET_LINKS',
	ADD_LINK: 'ADD_LINK',
	EDIT_LINK: 'EDIT_LINK',
	DELETE_LINK: 'DELETE_LINK',
	RESET_SLASHTAGS_STORE: 'RESET_SLASHTAGS_STORE',
	CACHE_PROFILE: 'CACHE_PROFILE',

	// Widgets
	UPDATE_WIDGETS: 'UPDATE_WIDGETS',
	SET_SLASHTAGS_AUTH_WIDGET: 'SET_SLASHTAGS_AUTH_WIDGET',
	SET_SLASHTAGS_FEED_WIDGET: 'SET_SLASHTAGS_FEED_WIDGET',
	DELETE_SLASHTAGS_WIDGET: 'DELETE_SLASHTAGS_WIDGET',
	RESET_WIDGETS_STORE: 'RESET_WIDGETS_STORE',
	SET_WIDGETS_ONBAORDING: 'SET_WIDGETS_ONBAORDING',
	SET_WIDGETS_SORT_ORDER: 'SET_WIDGETS_SORT_ORDER',

	// Settings
	UPDATE_SETTINGS: 'UPDATE_SETTINGS',
	UPDATE_ELECTRUM_PEERS: 'UPDATE_ELECTRUM_PEERS',
	RESET_SETTINGS_STORE: 'RESET_SETTINGS_STORE',
};
export default actions;
