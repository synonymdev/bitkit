// TODO(slashtags): move this interface to the Slashtags SDK once its stable?
import { EAddressType } from 'beignet';

export type BasicProfile = Partial<{
	name: string;
	bio: string;
	image: string;
	links: Array<Link>;
}>;

/** Contact Record saved in the "contacts" SlashDrive */
export type IContactRecord = { url: string; name: string } & BasicProfile;

export type TContacts = {
	[id: string]: IContactRecord;
};

export type SlashPayConfig = {
	type: EAddressType | 'lightningInvoice';
	value: string;
}[];

export type Link = {
	// tell TS we don't want an id field in the remote Link
	id?: never;
	title: string;
	url: string;
};

export type LocalLink = {
	id: string;
	title: string;
	url: string;
};

export interface IRemote {
	profile?: BasicProfile;
	payConfig?: SlashPayConfig;
}

export type TOnboardingProfileStep =
	| 'Intro'
	| 'InitialEdit'
	| 'OfflinePayments'
	| 'Done';

export type TSlashtagsState = {
	contacts: TContacts;
	lastPaidContacts: string[];
	links: LocalLink[];
	onboardedContacts: boolean;
	onboardingProfileStep: TOnboardingProfileStep;
	profilesCache: {
		[id: string]: BasicProfile;
	};
};
