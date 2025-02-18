import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

import useNewsWidget from '../../hooks/useNewsWidget';
import { TNewsWidgetOptions } from '../../store/types/widgets';
import { BodyM, CaptionB, Title } from '../../styles/text';
import { openAppURL } from '../../utils/helpers';
import BaseWidget from './BaseWidget';

const NewsWidget = ({
	options,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	options: TNewsWidgetOptions;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('widgets');
	const { data: article, status } = useNewsWidget();

	return (
		<BaseWidget
			id="news"
			style={style}
			// isLoading={isLoading}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}
			onPress={(): void => {
				if (!isEditing && article?.link) {
					openAppURL(article.link);
				}
			}}>
			{status === 'error' && (
				<View style={styles.columnLeft}>
					<CaptionB color="secondary" numberOfLines={1}>
						{t('news.error')}
					</CaptionB>
				</View>
			)}

			{status === 'ready' && (
				<>
					{options.showDate && article?.timeAgo && (
						<BodyM style={styles.date} numberOfLines={1}>
							{article.timeAgo}
						</BodyM>
					)}

					{options.showTitle && (
						<Title numberOfLines={2}>{article?.title}</Title>
					)}

					{options.showSource && (
						<TouchableOpacity
							style={styles.source}
							activeOpacity={0.7}
							hitSlop={{ right: 15, bottom: 15, left: 15 }}
							onPress={(): void => {
								if (article?.link) {
									openAppURL(article.link);
								}
							}}>
							<View style={styles.columnLeft}>
								<CaptionB color="secondary" numberOfLines={1}>
									{t('widget.source')}
								</CaptionB>
							</View>
							<View style={styles.columnRight}>
								<CaptionB color="secondary" numberOfLines={1}>
									{article?.publisher}
								</CaptionB>
							</View>
						</TouchableOpacity>
					)}
				</>
			)}
		</BaseWidget>
	);
};

const styles = StyleSheet.create({
	date: {
		marginBottom: 16,
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
		justifyContent: 'space-between',
	},
});

export default memo(NewsWidget);
