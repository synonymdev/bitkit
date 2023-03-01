import cardsEN from './en/cards.json';
import cardsRU from './ru/cards.json';
import commonEN from './en/common.json';
import commonRU from './ru/common.json';
import feeEN from './en/fee.json';
import feeRU from './ru/fee.json';
import lightningEN from './en/lightning.json';
import lightningRU from './ru/lightning.json';
import onboardingEN from './en/onboarding.json';
import onboardingRU from './ru/onboarding.json';
import otherEN from './en/other.json';
import otherRU from './ru/other.json';
import securityEN from './en/security.json';
import securityRU from './ru/security.json';
import settingsEN from './en/settings.json';
import settingsRU from './ru/settings.json';
import slashtagsEN from './en/slashtags.json';
import slashtagsRU from './ru/slashtags.json';
import walletEN from './en/wallet.json';
import walletRU from './ru/wallet.json';

export default {
	en: {
		cards: cardsEN,
		common: commonEN,
		fee: feeEN,
		lightning: lightningEN,
		onboarding: onboardingEN,
		other: otherEN,
		security: securityEN,
		settings: settingsEN,
		slashtags: slashtagsEN,
		wallet: walletEN,
	},
	ru: {
		cards: cardsRU,
		common: commonRU,
		fee: feeRU,
		lightning: lightningRU,
		onboarding: onboardingRU,
		other: otherRU,
		security: securityRU,
		settings: settingsRU,
		slashtags: slashtagsRU,
		wallet: walletRU,
	},
} as const;
