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
	'slashfeed:wz4i9gjw7imtc7hjk19hdzk4u9s7ad3cxyu45w6ppn1bbm3qjx3y#encryptionKey=nds189gg3hgpei45y79f9ho6s6yh4sm3su1bw4yktt9gtggxtxty';
const NewsFeedURL =
	'slashfeed:t3qxa979ncbd1arcxydjcn98i7faroyd7yma7ww6o8wn1tbxmuqy#encryptionKey=yrrfn8n3guaonho4oafgic7xcmbjwfhb6ihxguqjaqf1mwhpxeco';
const BlocksFeedURL =
	'slashfeed:qnf3xduurngb8oowmbpimfqsibe5bf914sqs437gowka1gqsh6uy#encryptionKey=jo6nybw8f3hzwea8jzcoyiymgimhfo4ftao93jxcinurgfrcxaay';
const BitcoinFactsURL =
	'slashfeed:deox9h7j9o8h47y86ybhd958r6wccsjyr5qpwjbc7rry5yqpix6o#encryptionKey=5da9xnmn6wboyiu3zihzr9k3tc11t5p4d9ypaimuwk7sbo3k7u5o';

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
						height={15}
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
					height={15}
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
		overflow: 'hidden',
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
