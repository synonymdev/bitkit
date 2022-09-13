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
import type { LightningStackParamList } from '../lightning/LightningNavigator';
import { SettingsStackParamList } from '../settings/SettingsNavigator';

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
	Scanner: undefined;
	WalletsDetail: {
		assetType: TAssetType;
	};
	LightningRoot: NavigatorScreenParams<LightningStackParamList>;
	Settings: undefined;
	Profile: undefined;
	ProfileEdit: undefined;
	Contacts: undefined;
	ContactEdit: { url: string };
	Contact: { url: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
	StackScreenProps<RootStackParamList, T>;

export type LightningScreenProps<T extends keyof LightningStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<LightningStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<SettingsStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;
