import React, { memo, ReactElement } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CaptionB, BodyMSB, BodySSB } from '../styles/text';
import { TFeedWidget } from '../store/types/widgets';
import { useSlashfeed } from '../hooks/widgets';
import BaseFeedWidget from './BaseFeedWidget';

const FeedWidget = ({
	url,
	widget,
	isEditing = false,
	style,
	testID,
	onLongPress,
}: {
	url: string;
	widget: TFeedWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { fields, config } = useSlashfeed({
		url,
		fields: widget.fields,
	});

	return (
		<BaseFeedWidget
			style={style}
			url={url}
			isEditing={isEditing}
			testID={testID}
			onLongPress={onLongPress}>
			<>
				{fields.map((field) => {
					return (
						<View key={field.name} style={styles.row}>
							<View style={styles.columnLeft}>
								<BodySSB color="secondary" numberOfLines={1}>
									{field.name}
								</BodySSB>
							</View>
							<View style={styles.columnRight}>
								<BodyMSB numberOfLines={1} ellipsizeMode="middle">
									{field.value}
								</BodyMSB>
							</View>
						</View>
					);
				})}

				{widget.extras?.showSource && config?.source && (
					<View style={styles.source}>
						<View style={styles.columnLeft}>
							<CaptionB color="secondary" numberOfLines={1}>
								{t('widget_source')}
							</CaptionB>
						</View>
						<View style={styles.columnRight}>
							<CaptionB color="secondary" numberOfLines={1}>
								{config.source.name}
							</CaptionB>
						</View>
					</View>
				)}
			</>
		</BaseFeedWidget>
	);
};

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 28,
	},
	columnLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	source: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default memo(FeedWidget);
