import { ImageSourcePropType } from 'react-native';

type Prize = {
	id: number;
	amount: number;
	image: ImageSourcePropType;
	title: string;
	description: string;
};

export const prizes: Prize[] = [
	{
		id: 1,
		amount: 100,
		image: require('../../assets/treasure-hunt/consolation-1.jpg'),
		title: 'Lightning Strikes',
		description:
			'Clouds gather, and a huge thunder bolt hits the treasure chest, liquifying most of the coins. Only 100 sats are left intact.',
	},
	{
		id: 2,
		amount: 10000,
		image: require('../../assets/treasure-hunt/prize.jpg'),
		title: 'Gavin’s Treasure',
		description:
			'You use commit access and manage to open the treasure chest! You find 10 000 sats and early Bitcoin source code.',
	},
	{
		id: 3,
		amount: 500,
		image: require('../../assets/treasure-hunt/consolation-2.jpg'),
		title: 'Boating Accident',
		description:
			'Your ship capsizes during a storm and you lose the private keys to the treasure chest. A pirate gives you 500 sats out of pity.',
	},
	{
		id: 4,
		amount: 20000,
		image: require('../../assets/treasure-hunt/prize.jpg'),
		title: 'Luke’s Treasure',
		description:
			'You use small blocks to break the lock and manage to open the treasure chest! Inside you find 20 000 sats and a few exotic BIPs.',
	},
	{
		id: 5,
		amount: 1000,
		image: require('../../assets/treasure-hunt/consolation-3.jpg'),
		title: 'To Da Moon!',
		description:
			'A rocket with shitcoiners entices you and takes you to da moon. No treasure for you! Under a moon rock, you find 1 000 sats.',
	},
	{
		id: 6,
		amount: 30000,
		image: require('../../assets/treasure-hunt/prize.jpg'),
		title: 'Nick’s Treasure',
		description:
			'You crack the programmable lock and manage to open the treasure chest! Inside\n you find 30 000 sats and some bit gold.',
	},
	{
		id: 7,
		amount: 2000,
		image: require('../../assets/treasure-hunt/consolation-4.jpg'),
		title: 'Mining Blast',
		description:
			"A Bitcoin miner explodes and destroys the treasure chest. In it's last few clock cycles, it mines and spits out 2 000 sats.",
	},
	{
		id: 8,
		amount: 40000,
		image: require('../../assets/treasure-hunt/prize.jpg'),
		title: 'Adam’s Treasure',
		description:
			'You use proof-of-work and manage to open the treasure chest! Inside you find 40 000 sats and some Hashcash.',
	},
	{
		id: 9,
		amount: 5000,
		image: require('../../assets/treasure-hunt/consolation-5.jpg'),
		title: 'Strong FUD',
		description:
			'The mayor of the island hands you 5 000 sats if you leave the treasure chest locked, as it may contain an ancient disease.',
	},
	{
		id: 10,
		amount: 50000,
		image: require('../../assets/treasure-hunt/prize.jpg'),
		title: 'Hal’s Treasure',
		description:
			'You break the encryption and manage to open the treasure chest! Inside you find 50 000 sats and the first-ever Bitcoin tx.',
	},
	{
		id: 11,
		amount: 10000,
		image: require('../../assets/treasure-hunt/consolation-6.jpg'),
		title: 'White Papercut',
		description:
			'You try to open the treasure chest with a folded Bitcoin white paper, but you cut yourself. 10 000 sats to stop the bleeding.',
	},
	{
		id: 12,
		amount: 100000,
		image: require('../../assets/treasure-hunt/prize.jpg'),
		title: 'Satoshi’s Treasure',
		description:
			'You use your conviction and manage to open the treasure chest! Inside you find 100 000 sats and a note from Satoshi.',
	},
	{
		id: 13,
		amount: 10000,
		image: require('../../assets/treasure-hunt/airdrop.jpg'),
		title: 'Satoshi’s Airdrop',
		description:
			'Magical lights flicker in the night sky. Hundreds of Bitcoiners gaze in amazement. A small gift from Satoshi.',
	},
	{
		id: 14,
		amount: 0,
		image: require('../../assets/treasure-hunt/airdrop.jpg'),
		title: 'Satoshi’s Airdrop',
		description:
			'Magical lights flicker in the night sky. You gaze in amazement, but forget to quickly grab your phone and scan the QR.',
	},
];
