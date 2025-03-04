import type {
	CompositeScreenProps,
	NavigatorScreenParams,
} from '@react-navigation/native';
import {
	NativeStackNavigationProp,
	NativeStackScreenProps,
} from '@react-navigation/native-stack';

import type { RecoveryStackParamList } from '../../screens/Recovery/RecoveryNavigator';
import type { IActivityItem } from '../../store/types/activity';
import type { TWidgetId, TWidgetOptions } from '../../store/types/widgets';
import type { OnboardingStackParamList } from '../OnboardingNavigator';
import type { SettingsStackParamList } from '../SettingsNavigator';
import type { TransferStackParamList } from '../TransferNavigator';
import type { WalletStackParamList } from '../WalletNavigator';
import type { BackupStackParamList } from '../bottom-sheet/BackupNavigation';
import type { LNURLWithdrawStackParamList } from '../bottom-sheet/LNURLWithdrawNavigation';
import type { OrangeTicketStackParamList } from '../bottom-sheet/OrangeTicketNavigation';
import type { PinStackParamList } from '../bottom-sheet/PINNavigation';
import type { ProfileLinkStackParamList } from '../bottom-sheet/ProfileLinkNavigation';
import type { ReceiveStackParamList } from '../bottom-sheet/ReceiveNavigation';
import type { SendStackParamList } from '../bottom-sheet/SendNavigation';
import type { TreasureHuntStackParamList } from '../bottom-sheet/TreasureHuntNavigation';

// TODO: move all navigation related types here
// https://reactnavigation.org/docs/typescript#organizing-types

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type RootStackParamList = {
	Wallet: NavigatorScreenParams<WalletStackParamList> | undefined;
	Biometrics: undefined;
	ActivityDetail: { id: IActivityItem['id']; extended?: boolean };
	ActivityAssignContact: { txid: string };
	AppUpdate: undefined;
	Scanner: { onScan: (data: string) => void } | undefined;
	TransferRoot: NavigatorScreenParams<TransferStackParamList>;
	Settings: NavigatorScreenParams<SettingsStackParamList>;
	Profile: undefined;
	ProfileEdit: undefined;
	Contacts: undefined;
	ContactEdit: { url: string };
	Contact: { url: string };
	BuyBitcoin: undefined;
	WidgetsOnboarding: undefined;
	WidgetsSuggestions: undefined;
	Widget: { id: TWidgetId; preview?: TWidgetOptions };
	WidgetEdit: { id: TWidgetId; initialFields: TWidgetOptions };
};

// Root Stack Navigator
export type RootStackScreenProps<T extends keyof RootStackParamList> =
	NativeStackScreenProps<RootStackParamList, T>;

export type OnboardingStackScreenProps<
	T extends keyof OnboardingStackParamList,
> = NativeStackScreenProps<OnboardingStackParamList, T>;

export type RecoveryStackScreenProps<T extends keyof RecoveryStackParamList> =
	NativeStackScreenProps<RecoveryStackParamList, T>;

// Nested Stack Navigators
export type WalletScreenProps<T extends keyof WalletStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<WalletStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

export type TransferScreenProps<T extends keyof TransferStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<TransferStackParamList, T>,
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

export type ProfileLinkScreenProps<T extends keyof ProfileLinkStackParamList> =
	NativeStackScreenProps<ProfileLinkStackParamList, T>;

export type ReceiveScreenProps<T extends keyof ReceiveStackParamList> =
	NativeStackScreenProps<ReceiveStackParamList, T>;

export type SendScreenProps<T extends keyof SendStackParamList> =
	NativeStackScreenProps<SendStackParamList, T>;

export type LNURLWithdrawProps<T extends keyof LNURLWithdrawStackParamList> =
	NativeStackScreenProps<LNURLWithdrawStackParamList, T>;

export type OrangeTicketScreenProps<
	T extends keyof OrangeTicketStackParamList,
> = NativeStackScreenProps<OrangeTicketStackParamList, T>;

export type TreasureHuntScreenProps<
	T extends keyof TreasureHuntStackParamList,
> = NativeStackScreenProps<TreasureHuntStackParamList, T>;
