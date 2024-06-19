// Add migrations for every persisted store version change
import { PersistedState } from 'redux-persist';

const migrations = {
	43: (state): PersistedState => {
		return {
			...state,
			user: {
				...state.user,
				scanAllAddressesTimestamp: 0,
			},
		};
	},
};

export default migrations;
