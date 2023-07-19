import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
	NavigatorScreenParams,
	CompositeScreenProps,
} from '@react-navigation/native';
import type {
	StackNavigationProp,
	StackScreenProps,
} from '@react-navigation/stack';

import type { IActivityItem } from '../../store/types/activity';
import type { OnboardingStackParamList } from '../onboarding/OnboardingNavigator';
import type { RecoveryStackParamList } from '../../screens/Recovery/RecoveryNavigator';
import type { WalletStackParamList } from '../wallet/WalletNavigator';
import type { LightningStackParamList } from '../lightning/LightningNavigator';
import type { TransferStackParamList } from '../transfer/TransferNavigator';
import type { WidgetsStackParamList } from '../widgets/WidgetsNavigator';
import type { SettingsStackParamList } from '../settings/SettingsNavigator';
import type { BackupStackParamList } from '../bottom-sheet/BackupNavigation';
import type { PinStackParamList } from '../bottom-sheet/PINNavigation';
import type { ProfileLinkStackParamList } from '../bottom-sheet/ProfileLinkNavigation';
import type { ReceiveStackParamList } from '../bottom-sheet/ReceiveNavigation';
import type { SendStackParamList } from '../bottom-sheet/SendNavigation';
import type { LNURLWithdrawStackParamList } from '../bottom-sheet/LNURLWithdrawNavigation';
import type { LNURLPayStackParamList } from '../bottom-sheet/LNURLPayNavigation';

// TODO: move all navigation related types here
// https://reactnavigation.org/docs/typescript#organizing-types

export type RootNavigationProp = StackNavigationProp<RootStackParamList>;

export type RootStackParamList = {
	Wallet: NavigatorScreenParams<WalletStackParamList> | undefined;
	Biometrics: undefined;
	ActivityDetail: { id: IActivityItem['id']; extended?: boolean };
	ActivityAssignContact: { txid: string };
	Scanner: { onScan: (data: string) => void } | undefined;
	LightningRoot: NavigatorScreenParams<LightningStackParamList>;
	Transfer: NavigatorScreenParams<TransferStackParamList>;
	Settings: NavigatorScreenParams<SettingsStackParamList>;
	Profile: undefined;
	ProfileEdit: undefined;
	ProfileDetails: undefined;
	Contacts: undefined;
	ContactEdit: { url: string };
	Contact: { url: string };
	BuyBitcoin: undefined;
	BetaRisk: undefined;
	WidgetFeedEdit: { url: string };
	WidgetsRoot: NavigatorScreenParams<WidgetsStackParamList> | undefined;
};

// Root Stack Navigator
export type RootStackScreenProps<T extends keyof RootStackParamList> =
	StackScreenProps<RootStackParamList, T>;

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

export type LightningScreenProps<T extends keyof LightningStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<LightningStackParamList, T>,
		RootStackScreenProps<keyof RootStackParamList>
	>;

export type TransferScreenProps<T extends keyof TransferStackParamList> =
	CompositeScreenProps<
		NativeStackScreenProps<TransferStackParamList, T>,
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

export type ProfileLinkScreenProps<T extends keyof ProfileLinkStackParamList> =
	NativeStackScreenProps<ProfileLinkStackParamList, T>;

export type ReceiveScreenProps<T extends keyof ReceiveStackParamList> =
	NativeStackScreenProps<ReceiveStackParamList, T>;

export type SendScreenProps<T extends keyof SendStackParamList> =
	NativeStackScreenProps<SendStackParamList, T>;

export type LNURLWithdrawProps<T extends keyof LNURLWithdrawStackParamList> =
	NativeStackScreenProps<LNURLWithdrawStackParamList, T>;

export type LNURLPayProps<T extends keyof LNURLPayStackParamList> =
	NativeStackScreenProps<LNURLPayStackParamList, T>;
