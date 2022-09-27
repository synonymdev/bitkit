import { Alert } from 'react-native';
import { ITodo, TTodoType } from '../../store/types/todos';
import { getStore } from '../../store/helpers';
import { addTodo, removeTodo } from '../../store/actions/todos';
import { toggleView } from '../../store/actions/user';
import { getOpenChannels } from '../lightning';
import { TChannel } from '@synonymdev/react-native-ldk';
import { getBalance } from '../wallet';

type TTodoPresets = { [key in TTodoType]: ITodo };
export const todoPresets: TTodoPresets = {
	activateBackup: {
		type: 'activateBackup',
		title: 'Secure your wallet',
		description: 'Activate online backups',
		id: 'activateBackup',
	},
	backupSeedPhrase: {
		type: 'backupSeedPhrase',
		title: 'Back up',
		description: 'Store your money',
		id: 'backupSeedPhrase',
	},
	boost: {
		type: 'boost',
		title: 'Boost Transaction',
		description: 'Increase transaction confirmation time',
		id: 'boost',
	},
	lightning: {
		type: 'lightning',
		title: 'Pay instantly',
		description: 'Get on Lightning',
		id: 'lightning',
	},
	pin: {
		type: 'pin',
		title: 'Better security',
		description: 'Set up a PIN code',
		id: 'pin',
	},
	slashtagsProfile: {
		type: 'slashtagsProfile',
		title: 'Public Profile',
		description: 'Add your details',
		id: 'slashtagsProfile',
	},
};

export const setupTodos = async (): Promise<void> => {
	const store = getStore();
	const todos = store.todos.todos ?? [];
	const dismissedTodos = store.todos.dismissedTodos ?? [];

	/*
	 * Check for backup status.
	 */
	const backupTodo = todos.filter((todo) => todo.type === 'activateBackup');
	const backupStatus = store.backup.remoteBackupsEnabled;
	const activateBackupIsDismissed = dismissedTodos.some(
		(todo) => todo === 'activateBackup',
	);
	// Add backupTodo if status is false and is not included in the todos array.
	if (!backupStatus && !backupTodo?.length && !activateBackupIsDismissed) {
		addTodo(todoPresets.activateBackup);
	}
	// Remove backupTodo if status is true and hasn't been removed from the todos array.
	if (backupStatus && backupTodo.length) {
		removeTodo(backupTodo[0].id);
	}

	/*
	 * Check for seed phrase backup.
	 */
	const seedPhraseDismissed = dismissedTodos.some(
		(todo) => todo === 'backupSeedPhrase',
	);
	const seedPhraseTodo = todos.filter(
		(todo) => todo.type === 'backupSeedPhrase',
	);
	const backupSeedPhraseStatus = !!store.user.backupVerified;
	// Add backupSeedPhrase to-do if it hasn't been previously dismissed and isn't included in the todos array
	// and backup has not been verified
	if (
		!backupSeedPhraseStatus &&
		!seedPhraseDismissed &&
		!seedPhraseTodo.length
	) {
		addTodo(todoPresets.backupSeedPhrase);
	}
	if (backupSeedPhraseStatus && seedPhraseTodo.length) {
		removeTodo(seedPhraseTodo[0].id);
	}

	/*
	 * Check for lightning.
	 */
	const lightning = todos.some((todo) => todo.type === 'lightning');
	const lightningIsDismissed = dismissedTodos.some(
		(todo) => todo === 'lightning',
	);
	const getLightningChannelsResponse = await getOpenChannels({
		fromStorage: true,
	});
	let lightningChannels: TChannel[] = [];
	if (getLightningChannelsResponse.isOk()) {
		lightningChannels = getLightningChannelsResponse.value;
	} else {
		lightningChannels = [];
	}
	const currentOnChainBalance = getBalance({ onchain: true });
	// Add lightning if the user has an onchain balance, lightning is not included in the todos array, hasn't been previously dismissed and no channels exist.
	if (
		!lightning &&
		!lightningIsDismissed &&
		lightningChannels.length <= 0 &&
		currentOnChainBalance.satoshis > 0
	) {
		addTodo(todoPresets.lightning);
	}

	// Remove lightning if it hasn't been removed from the todos array and channels exist.
	if (lightning && lightningChannels.length > 0) {
		removeTodo('lightning');
	}

	/*
	 * Check for PIN.
	 */
	const pin = todos.some((todo) => todo.type === 'pin');
	const pinIsDismissed = dismissedTodos.some((todo) => todo === 'pin');
	// Add pin if status is false and is not included in the todos array.
	if (!pin && !pinIsDismissed) {
		addTodo(todoPresets.pin);
	}
	// Remove pin if status is true and hasn't been removed from the todos array.
	// if (pin.length) {
	// 	removeTodo(pin[0].id);
	// }

	/*
	 * Check for Slashtags Profile.
	 */
	const slashtagsProfile = todos.some(
		(todo) => todo.type === 'slashtagsProfile',
	);
	const slashtagsProfileIsDismissed = dismissedTodos.some(
		(todo) => todo === 'slashtagsProfile',
	);
	const slashtagsProfileStatus =
		store.slashtags.onboardingProfileStep !== 'Intro';
	// Add pin if status is false and is not included in the todos array.
	if (
		!slashtagsProfile &&
		!slashtagsProfileIsDismissed &&
		!slashtagsProfileStatus
	) {
		addTodo(todoPresets.slashtagsProfile);
	}
	// Remove slashtagsProfile if status is true and hasn't been removed from the todos array.
	if (slashtagsProfile && slashtagsProfileStatus) {
		removeTodo('slashtagsProfile');
	}
};

export const handleOnPress = ({
	navigation,
	type,
}: {
	navigation;
	type: TTodoType;
}): void => {
	try {
		switch (type) {
			case 'activateBackup':
				navigation.navigate('Settings', { screen: 'BackupData' });
				break;
			case 'pin':
				toggleView({
					view: 'PINPrompt',
					data: { isOpen: true, showLaterButton: true },
				});
				break;
			case 'lightning':
				navigation.navigate('LightningRoot');
				break;
			case 'backupSeedPhrase':
				toggleView({
					view: 'backupPrompt',
					data: { isOpen: true },
				});
				break;
			case 'slashtagsProfile':
				navigation.navigate('Profile');
				break;
			default:
				Alert.alert('TODO: ' + type);
				return;
		}
	} catch {}
};
