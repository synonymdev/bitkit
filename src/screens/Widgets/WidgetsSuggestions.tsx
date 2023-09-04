import React, { ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Caption13M, Text01M } from '../../styles/text';
import { ChevronRight, QuestionMarkIcon } from '../../styles/icons';
import { View, ScrollView, TouchableOpacity } from '../../styles/components';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import SvgImage from '../../components/SvgImage';
import Divider from '../../components/Divider';
import Button from '../../components/Button';
import { handleSlashtagURL } from '../../utils/slashtags';
import { useSlashfeed } from '../../hooks/widgets';
import type { RootStackScreenProps } from '../../navigation/types';

const PriceFeedURL =
	'slashfeed:azswe48ifp8gmk3p44e7futnxp6dxjm6izbgdyy96nqk8876xtty/Bitcoin Price';
const NewsFeedURL =
	'slashfeed:dwqu3z7jrt58h63y5k91nzdawwoe8jz33yypkdhm4gdf6egn39qo/Bitcoin Headlines';
const BlocksFeedURL =
	'slashfeed:ourqbz3s3e1yqs5wqkzqo74zoydqqssgskueo6gsgp46e5i5ecdo/Bitcoin Blocks';
const BitcoinFactsURL =
	'slashfeed:6zwka9fw7orrfb7kbeojhre1yyrgd9foss8a3z9x5rtss1k9ujao/Bitcoin Facts';

const WidgetsSuggestions = ({
	navigation,
}: RootStackScreenProps<'WidgetsSuggestions'>): ReactElement => {
	const { t } = useTranslation('slashtags');

	return (
		<View style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader
				title={t('widget_add')}
				onClosePress={(): void => navigation.navigate('Wallet')}
			/>
			<View style={styles.content}>
				<ScrollView>
					<Feed url={PriceFeedURL} testID="PriceWidget" />
					<Feed url={NewsFeedURL} testID="HeadlinesWidget" />
					<Feed url={BlocksFeedURL} testID="BlocksWidget" />
					<Feed url={BitcoinFactsURL} testID="FactsWidget" />
				</ScrollView>

				<View style={styles.buttonContainer}>
					<Button
						style={styles.button}
						text={t('widget_qr')}
						size="large"
						onPress={(): void => navigation.navigate('Scanner')}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</View>
	);
};

const Feed = ({
	url,
	testID,
}: {
	url: string;
	testID?: string;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { config, icon, loading, failed } = useSlashfeed({ url });

	if (loading || !config) {
		return (
			<TouchableOpacity
				style={failed && styles.feedDisabled}
				activeOpacity={0.6}
				disabled={failed}
				testID={testID}
				onPress={(): void => handleSlashtagURL(url)}>
				<View style={styles.feed}>
					<View style={styles.icon}>
						<QuestionMarkIcon width={48} height={48} />
					</View>
					<View style={styles.text}>
						<Text01M numberOfLines={1}>{url}</Text01M>
						<Caption13M color="gray1" numberOfLines={1}>
							{failed
								? t('widget_failed_description')
								: t('widget_loading_description')}
						</Caption13M>
					</View>
					<ChevronRight
						style={styles.arrow}
						color="gray1"
						width={24}
						height={24}
					/>
				</View>
				<Divider />
			</TouchableOpacity>
		);
	}

	return (
		<TouchableOpacity
			activeOpacity={0.6}
			testID={testID}
			onPress={(): void => handleSlashtagURL(url)}>
			<View style={styles.feed}>
				<View style={styles.icon}>
					{icon ? (
						<SvgImage image={icon} size={48} />
					) : (
						<QuestionMarkIcon width={48} height={48} />
					)}
				</View>
				<View style={styles.text}>
					<Text01M numberOfLines={1}>{config.name}</Text01M>
					<Caption13M color="gray1" numberOfLines={1}>
						{config.description}
					</Caption13M>
				</View>
				<ChevronRight
					style={styles.arrow}
					color="gray1"
					width={24}
					height={24}
				/>
			</View>
			<Divider />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: 16,
	},
	feed: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	feedDisabled: {
		opacity: 0.5,
	},
	text: {
		flex: 1,
		paddingRight: 20,
	},
	icon: {
		height: 48,
		width: 48,
		marginRight: 16,
		borderRadius: 8,
		// overflow: 'hidden',
	},
	arrow: {
		marginLeft: 'auto',
	},
	buttonContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
	},
	button: {
		flex: 1,
	},
});

export default WidgetsSuggestions;
