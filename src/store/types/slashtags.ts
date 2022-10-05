// TODO(slashtags): move this interface to the Slashtags SDK once its stable?
export type BasicProfile = Partial<{
	name: string;
	bio: string;
	image: string;
	links: Array<Link>;
}>;

/** Contact Record saved in the "contacts" SlashDrive */
export type IContactRecord = { url: string; name: string } & BasicProfile;

export type SlashPayConfig = { type: string; value: string }[];

export interface Link {
	title: string;
	url: string;
}

export interface IRemote {
	profile?: BasicProfile;
	payConfig?: SlashPayConfig;
}

export interface ISlashtags {
	onboardedContacts: boolean;
	onboardingProfileStep:
		| 'Intro'
		| 'InitialEdit'
		| 'PaymentsFromContacts'
		| 'OfflinePayments'
		| 'Done';
	links: Link[];
	seeder?: {
		lastSent?: number;
	};
}
