import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import Divider from '../../components/Divider';
import SvgImage from '../../components/SvgImage';
import {
	bitcoinFactsUrl,
	blocksFeedUrl,
	newsFeedUrl,
	priceFeedUrl,
} from '../../constants/widgets';
import { useSlashfeed } from '../../hooks/widgets';
import { TouchableOpacity, View } from '../../styles/components';
import { ChevronRight, QuestionMarkIcon } from '../../styles/icons';
import { BodyMSB, CaptionB } from '../../styles/text';
import { handleSlashtagURL } from '../../utils/slashtags';

const FeedWidgetItem = ({
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
				disabled={failed}
				testID={testID}
				onPress={(): void => handleSlashtagURL(url)}>
				<View style={styles.feed}>
					<View style={styles.icon}>
						<QuestionMarkIcon width={48} height={48} />
					</View>
					<View style={styles.text}>
						<BodyMSB numberOfLines={1}>{url}</BodyMSB>
						<CaptionB color="secondary" numberOfLines={1}>
							{failed
								? t('widget_failed_description')
								: t('widget_loading_description')}
						</CaptionB>
					</View>
					<ChevronRight
						style={styles.arrow}
						color="secondary"
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
					<BodyMSB numberOfLines={1}>{config.name}</BodyMSB>
					<CaptionB color="secondary" numberOfLines={1}>
						{config.description}
					</CaptionB>
				</View>
				<ChevronRight
					style={styles.arrow}
					color="secondary"
					width={24}
					height={24}
				/>
			</View>
			<Divider />
		</TouchableOpacity>
	);
};

const FeedWidgetItems = (): ReactElement => (
	<>
		<FeedWidgetItem url={priceFeedUrl} testID="PriceWidget" />
		<FeedWidgetItem url={newsFeedUrl} testID="HeadlinesWidget" />
		<FeedWidgetItem url={blocksFeedUrl} testID="BlocksWidget" />
		<FeedWidgetItem url={bitcoinFactsUrl} testID="FactsWidget" />
	</>
);

const styles = StyleSheet.create({
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
});

export default FeedWidgetItems;
