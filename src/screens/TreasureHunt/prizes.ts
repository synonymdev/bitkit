import { ImageSourcePropType } from 'react-native';
import { TChest } from '../../store/types/settings';

export type TPrize = {
	winType: TChest['winType'];
	amount: number;
	image: ImageSourcePropType;
	title: string;
	description: string;
	note?: string;
};

export const emptyPrize: TPrize = {
	winType: 'empty',
	amount: 0,
	image: require('../../assets/treasure-hunt/empty.jpg'),
	title: 'Toxic Despair',
	description:
		'You successfully unlock the treasure chest, only to find it empty. A bunch of toxic Bitcoiners took it all.',
	note: 'Sorry, Satoshi has run out of coins to hand out. Thank you for testing Bitkit. The Synonym Team.',
};

export const prizes: TPrize[][] = [
	[
		{
			winType: 'consolation',
			amount: 500,
			image: require('../../assets/treasure-hunt/consolation-1.jpg'),
			title: 'Lightning Strikes',
			description:
				'Clouds gather, and a huge thunderbolt hits the treasure chest, liquifying most of the coins. Only 100 sats are left intact.',
		},
		{
			winType: 'winning',
			amount: 10000,
			image: require('../../assets/treasure-hunt/prize.jpg'),
			title: "Gavin's Treasure",
			description:
				'You use commit access and manage to open the treasure chest! You find 10 000 sats and early Bitcoin source code.',
		},
	],
	[
		{
			winType: 'consolation',
			amount: 1000,
			image: require('../../assets/treasure-hunt/consolation-2.jpg'),
			title: 'Boating Accident',
			description:
				'Your ship capsizes during a storm and you lose the private keys to the treasure chest. A pirate gives you 500 sats out of pity.',
		},
		{
			winType: 'winning',
			amount: 20000,
			image: require('../../assets/treasure-hunt/prize.jpg'),
			title: "Luke's Treasure",
			description:
				'You use small blocks to break the lock and manage to open the treasure chest! Inside you find 20 000 sats and a few exotic BIPs.',
		},
	],
	[
		{
			winType: 'consolation',
			amount: 1500,
			image: require('../../assets/treasure-hunt/consolation-3.jpg'),
			title: 'To Da Moon!',
			description:
				'A rocket with shitcoiners entices you and takes you to da moon. No treasure for you! Under a moon rock, you find 1 000 sats.',
		},
		{
			winType: 'winning',
			amount: 30000,
			image: require('../../assets/treasure-hunt/prize.jpg'),
			title: "Nick's Treasure",
			description:
				'You crack the programmable lock and manage to open the treasure chest! Inside\n you find 30 000 sats and some bit gold.',
		},
	],
	[
		{
			winType: 'consolation',
			amount: 2000,
			image: require('../../assets/treasure-hunt/consolation-4.jpg'),
			title: 'Mining Blast',
			description:
				"A Bitcoin miner explodes and destroys the treasure chest. In it's last few clock cycles, it mines and spits out 2 000 sats.",
		},
		{
			winType: 'winning',
			amount: 40000,
			image: require('../../assets/treasure-hunt/prize.jpg'),
			title: "Adam's Treasure",
			description:
				'You use proof-of-work and manage to open the treasure chest! Inside you find 40 000 sats and some Hashcash.',
		},
	],
	[
		{
			winType: 'consolation',
			amount: 5000,
			image: require('../../assets/treasure-hunt/consolation-5.jpg'),
			title: 'Strong FUD',
			description:
				'The mayor of the island hands you 5 000 sats if you leave the treasure chest locked, as it may contain an ancient disease.',
		},
		{
			winType: 'winning',
			amount: 50000,
			image: require('../../assets/treasure-hunt/prize.jpg'),
			title: "Hal's Treasure",
			description:
				'You break the encryption and manage to open the treasure chest! Inside you find 50 000 sats and the first-ever Bitcoin tx.',
		},
	],
	[
		{
			winType: 'consolation',
			amount: 10000,
			image: require('../../assets/treasure-hunt/consolation-6.jpg'),
			title: 'White Papercut',
			description:
				'You try to open the treasure chest with a folded Bitcoin white paper, but you cut yourself. 10 000 sats to stop the bleeding.',
			note: 'The payout may take about a minute. Thank you for testing Bitkit. The Synonym Team.',
		},
		{
			winType: 'winning',
			amount: 100000,
			image: require('../../assets/treasure-hunt/prize.jpg'),
			title: "Satoshi's Treasure",
			description:
				'You use your conviction and manage to open the treasure chest! Inside you find 100 000 sats and a note from Satoshi.',
			note: '“Congrats on completing the Treasure Hunt. May the sats be with you.”',
		},
	],
];

export const airdrop: TPrize[] = [
	{
		winType: 'empty',
		amount: 0,
		image: require('../../assets/treasure-hunt/airdrop.jpg'),
		title: "Satoshi's Airdrop",
		description:
			'Magical lights flicker in the night sky. You gaze in amazement, but forget to quickly grab your phone and scan the QR.',
		note: 'Sorry, Satoshi has run out of coins to hand out. Thank you for testing Bitkit. The Synonym Team.',
	},
	{
		winType: 'winning',
		amount: 10000,
		image: require('../../assets/treasure-hunt/airdrop.jpg'),
		title: "Satoshi's Airdrop",
		description:
			'Magical lights flicker in the night sky. Hundreds of Bitcoiners gaze in amazement. A small gift from Satoshi.',
		note: 'Thank you for testing Bitkit. The Synonym Team.',
	},
];
