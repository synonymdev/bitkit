import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
	NavigatorScreenParams,
	CompositeScreenProps,
} from '@react-navigation/native';
import type {
	StackNavigationProp,
	StackScreenProps,
} from '@react-navigation/stack';
import type { IService, IGetOrderResponse } from '@synonymdev/blocktank-client';

import type { IActivityItem } from '../../store/types/activity';
import type { TAssetType } from '../../store/types/wallet';
import type { OnboardingStackParamList } from '../onboarding/OnboardingNavigator';
import type { TabStackParamList } from '../tabs/TabNavigator';
import type { LightningStackParamList } from '../lightning/LightningNavigator';
import type { WidgetsStackParamList } from '../widgets/WidgetsNavigator';
import type { SettingsStackParamList } from '../settings/SettingsNavigator';
import type { BackupStackParamList } from '../bottom-sheet/BackupNavigation';
import type { PinStackParamList } from '../bottom-sheet/PINNavigation';
import type { ReceiveStackParamList } from '../bottom-sheet/ReceiveNavigation';
import type { SendStackParamList } from '../bottom-sheet/SendNavigation';

// TODO: move all navigation related types here
// https://reactnavigation.org/docs/typescript#organizing-types

export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

export type RootStackParamList = {
	RootAuthCheck: { onSuccess: () => void };
	Tabs: undefined;
	Biometrics: undefined;
	Blocktank: undefined;
	BlocktankOrder: {
		service: IService;
		existingOrderId: string;
	};
	BlocktankPayment: {
		order: IGetOrderResponse;
	};
	ActivityDetail: { activityItem: IActivityItem; extended?: boolean };
	ActivityFiltered: undefined;
	ActivityAssignContact: { txid: string };
	Scanner: { onScan: (data: string) => void } | undefined;
	WalletsDetail: {
		assetType: TAssetType;
	};
	LightningRoot: NavigatorScreenParams<LightningStackParamList>;
	Settings: NavigatorScreenParams<SettingsStackParamList>;
	Profile: undefined;
	ProfileEdit: undefined;
	ProfileAddLink: undefined;
	ProfileLinkSuggestions: undefined;
	Contacts: undefined;
	ContactEdit: { url: string };
	Contact: { url: string };
	BuyBitcoin: undefined;
	BlocktankOrders: undefined;
	WidgetFeedEdit: { url: string };
	WidgetsRoot: undefined;
};

// Root Stack Navigator
export type RootStackScreenProps<T extends keyof RootStackParamList> =
	StackScreenProps<RootStackParamList, T>;

export type OnboardingStackScreenProps<
	T extends keyof OnboardingStackParamList,
> = NativeStackScreenProps<OnboardingStackParamList, T>;

// Nested Stack Navigators
export type TabScreenProps<T extends keyof TabStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<TabStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

export type LightningScreenProps<T extends keyof LightningStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<LightningStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

export type WidgetsScreenProps<T extends keyof WidgetsStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<WidgetsStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<SettingsStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

// BottomSheet Navigators
export type BackupScreenProps<T extends keyof BackupStackParamList> =
	NativeStackScreenProps<BackupStackParamList, T>;

export type PinScreenProps<T extends keyof PinStackParamList> =
	NativeStackScreenProps<PinStackParamList, T>;

export type ReceiveScreenProps<T extends keyof ReceiveStackParamList> =
	NativeStackScreenProps<ReceiveStackParamList, T>;

export type SendScreenProps<T extends keyof SendStackParamList> =
	NativeStackScreenProps<SendStackParamList, T>;
