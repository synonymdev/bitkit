import { AppState } from 'react-native';

export const appStateTracker = {
	lastAppState: AppState.currentState,
	lastBackgroundTime: 0,

	init() {
		AppState.addEventListener('change', (nextAppState) => {
			if (['background', 'inactive'].includes(nextAppState)) {
				this.lastBackgroundTime = Date.now();
			} else if (['background', 'inactive'].includes(this.lastAppState)) {
				// If we're leaving background state, update the time
				this.lastBackgroundTime = Date.now();
			}
			this.lastAppState = nextAppState;
		});
	},

	wasRecentlyInBackground(): boolean {
		const currentState = AppState.currentState;
		const inBackground = ['background', 'inactive'].includes(currentState);
		const timeSinceLastBackground = Date.now() - this.lastBackgroundTime;

		return inBackground || timeSinceLastBackground < 3000;
	},
};
