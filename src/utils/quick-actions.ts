import { Platform } from 'react-native';
import QuickActions from 'react-native-quick-actions';

QuickActions.setShortcutItems([
	{
		type: 'Recovery',
		title: 'Recovery',
		icon: Platform.select({ ios: 'Recovery', android: 'recovery' })!,
		userInfo: { url: '' },
	},
]);
