import React, { ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SvgProps } from 'react-native-svg';

import Card from '../../components/Card';
import { EItemType, Item, ItemData } from '../../components/List';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import type { RootStackScreenProps } from '../../navigation/types';
import { View as ThemedView } from '../../styles/components';
import {
	AirplaneIcon,
	BicycleIcon,
	CarIcon,
	ForkKnifeIcon,
	GameControllerIcon,
	GiftIcon,
	GlobeIcon,
	HeadphonesIcon,
	HeartbeatIcon,
	HorseIcon,
	HouseIcon,
	PedestrianIcon,
	PhoneCallIcon,
	PrinterIcon,
	ShoppingBagIcon,
	ShoppingCartIcon,
	StackIcon,
	StorefrontIcon,
	TrainIcon,
	VideoCameraIcon,
} from '../../styles/icons';
import { Caption13Up } from '../../styles/text';

const imageGift = require('../../assets/illustrations/gift.png');
const imageGlobe = require('../../assets/illustrations/globe.png');
const imagePhone = require('../../assets/illustrations/phone.png');
const imageRocket = require('../../assets/illustrations/rocket2.png');

const categories = [
	{ title: 'Apparel', route: 'buy/apparel', icon: PedestrianIcon },
	{ title: 'Automobiles', route: 'buy/automobiles', icon: CarIcon },
	{ title: 'Cruises', route: 'buy/cruises', icon: TrainIcon },
	{ title: 'Ecommerce', route: 'buy/ecommerce', icon: ShoppingCartIcon },
	{ title: 'Electronics', route: 'buy/electronics', icon: PrinterIcon },
	{
		title: 'Entertainment',
		route: 'buy/entertainment',
		icon: HeadphonesIcon,
	},
	{ title: 'Experiences', route: 'buy/experiences', icon: GlobeIcon },
	{ title: 'Flights', route: 'buy/flights', icon: AirplaneIcon },
	{ title: 'Food', route: 'buy/food', icon: StorefrontIcon },
	{
		title: 'Food Delivery',
		route: 'buy/food-delivery',
		icon: BicycleIcon,
	},
	{ title: 'Games', route: 'buy/games', icon: GameControllerIcon },
	{ title: 'Gifts', route: 'buy/gifts', icon: GiftIcon },
	{ title: 'Groceries', route: 'buy/groceries', icon: ShoppingBagIcon },
	{
		title: 'Health & Beauty',
		route: 'buy/health-beauty',
		icon: HeartbeatIcon,
	},
	{ title: 'Home', route: 'buy/home', icon: HouseIcon },
	{ title: 'Multi-Brand', route: 'buy/multi-brand', icon: StackIcon },
	{ title: 'Pets', route: 'buy/pets', icon: HorseIcon },
	{
		title: 'Restaurants',
		route: 'buy/restaurants',
		icon: ForkKnifeIcon,
	},
	{ title: 'Retail', route: 'buy/retail', icon: StorefrontIcon },
	{ title: 'Streaming', route: 'buy/streaming', icon: VideoCameraIcon },
	{ title: 'Travel', route: 'buy/travel', icon: AirplaneIcon },
	{ title: 'VoIP', route: 'buy/voip', icon: PhoneCallIcon },
];

const ShopDiscover = ({
	navigation,
}: RootStackScreenProps<'ShopDiscover'>): ReactElement => {
	const { t } = useTranslation('other');
	const { width } = useWindowDimensions();

	const cardSize = (width - 32 - 16) / 2;

	const listData: ItemData[] = useMemo(() => {
		const wrappedIcon = (Icon: React.FC<SvgProps>): React.FC<SvgProps> => {
			return (props: SvgProps) => (
				<ThemedView style={styles.icon} color="white10">
					<Icon {...props} color="white" width={16} height={16} />
				</ThemedView>
			);
		};

		return categories.map((category) => ({
			title: category.title,
			type: EItemType.button,
			Icon: wrappedIcon(category.icon),
			onPress: (): void => {
				navigation.navigate('ShopMain', { page: category.route });
			},
		}));
	}, [navigation]);

	const ListHeader = () => (
		<>
			<View style={styles.cards}>
				<Card
					title={t('shop.discover.gift-cards.title')}
					description={t('shop.discover.gift-cards.description')}
					size={cardSize}
					color="green24"
					image={imageGift}
					onPress={() => {
						navigation.navigate('ShopMain', { page: 'gift-cards' });
					}}
				/>

				<Card
					title={t('shop.discover.esims.title')}
					description={t('shop.discover.esims.description')}
					size={cardSize}
					color="yellow24"
					image={imageGlobe}
					onPress={() => {
						navigation.navigate('ShopMain', { page: 'esims' });
					}}
				/>

				<Card
					title={t('shop.discover.refill.title')}
					description={t('shop.discover.refill.description')}
					size={cardSize}
					color="purple24"
					image={imagePhone}
					onPress={() => {
						navigation.navigate('ShopMain', { page: 'refill' });
					}}
				/>

				<Card
					title={t('shop.discover.travel.title')}
					description={t('shop.discover.travel.description')}
					size={cardSize}
					color="red24"
					image={imageRocket}
					onPress={() => {
						navigation.navigate('ShopMain', { page: 'buy/travel' });
					}}
				/>
			</View>

			<View style={styles.sectionHeader}>
				<Caption13Up color="secondary">{t('shop.discover.label')}</Caption13Up>
			</View>
		</>
	);

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('shop.discover.nav_title')} />

			<FlatList
				data={listData}
				renderItem={({ item }) => <Item {...item} />}
				ListHeaderComponent={ListHeader}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			/>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	content: {
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	cards: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
		marginBottom: 16,
	},
	sectionHeader: {
		height: 50,
		justifyContent: 'center',
	},
	icon: {
		borderRadius: 40,
		width: 32,
		height: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default ShopDiscover;
