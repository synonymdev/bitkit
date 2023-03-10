import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text01M, Caption13M } from '../styles/text';
import { CubeIcon } from '../styles/icons';
import { BaseFeedWidget } from './FeedWidget';
import { IWidget } from '../store/types/widgets';
import { useFeedWidget } from '../hooks/widgets';

const BlocksWidget = ({
	url,
	widget,
	isEditing = false,
	onLongPress,
	onPressIn,
	testID,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	onLongPress?: () => void;
	onPressIn?: () => void;
	testID?: string;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { value } = useFeedWidget({ url, feed: widget.feed });

	return (
		<BaseFeedWidget
			url={url}
			name={t('widget_blocks')}
			label={value?.height || ''}
			icon={<CubeIcon width={32} height={32} />}
			isEditing={isEditing}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			right={
				<View style={styles.numbers}>
					{value && (
						<>
							<Text01M style={styles.price} numberOfLines={1}>
								{`${value?.transacionCount} / ${value?.size}`}
							</Text01M>
							<Caption13M style={styles.change} color="gray1" numberOfLines={1}>
								{value?.time}
							</Caption13M>
						</>
					)}
				</View>
			}
			testID={testID}
		/>
	);
};

const styles = StyleSheet.create({
	numbers: {
		alignItems: 'flex-end',
	},
	price: {
		lineHeight: 22,
	},
	change: {
		lineHeight: 18,
	},
});

export default memo(BlocksWidget);
