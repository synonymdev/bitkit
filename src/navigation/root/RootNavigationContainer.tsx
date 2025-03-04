import {
	DarkTheme,
	LinkingOptions,
	NavigationContainer,
	createNavigationContainerRef,
} from '@react-navigation/native';
import React, { ReactElement } from 'react';
import { Linking } from 'react-native';

import { processUri } from '../../utils/scanner/scanner';
import { RootStackParamList } from '../types';

export type NavigateScreenArgs = {
	[K in keyof RootStackParamList]: undefined extends RootStackParamList[K]
		? [screen: K] | [screen: K, params: RootStackParamList[K]]
		: [screen: K, params: RootStackParamList[K]];
}[keyof RootStackParamList];

/**
 * Helper function to navigate from outside components.
 */
const navigationRef = createNavigationContainerRef<RootStackParamList>();
export const rootNavigation = {
	getCurrentRoute: (): string | undefined => {
		if (navigationRef.isReady()) {
			const route = navigationRef.getCurrentRoute();
			return route ? route.name : undefined;
		}
		return undefined;
	},
	navigate: (...args: NavigateScreenArgs): void => {
		if (navigationRef.isReady()) {
			navigationRef.navigate(...args);
		} else {
			// Decide what to do if react navigation is not ready
			console.log('rootNavigation not ready');
		}
	},
	goBack: (): void => {
		if (navigationRef.isReady()) {
			navigationRef.goBack();
		}
	},
};

const RootNavigationContainer = ({
	children,
}: {
	children: ReactElement;
}): ReactElement => {
	const linking: LinkingOptions<RootStackParamList> = {
		prefixes: ['bitkit', 'slash', 'bitcoin', 'lightning'],
		subscribe(listener): () => void {
			// Deep linking if the app is already open
			const subscription = Linking.addEventListener('url', ({ url }): void => {
				rootNavigation.navigate('Wallet');
				processUri({ uri: url });
				listener(url);
			});

			return () => {
				subscription.remove();
			};
		},
	};

	return (
		<NavigationContainer
			ref={navigationRef}
			theme={DarkTheme}
			linking={linking}>
			{children}
		</NavigationContainer>
	);
};

export default RootNavigationContainer;
