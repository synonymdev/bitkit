import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';

import { Text01M, Caption13M, CubeIcon } from '../styles/components';
import { BaseFeedWidget } from './FeedWidget';
import { IWidget } from '../store/types/widgets';
import { useFeedWidget } from '../hooks/widgets';

const BlocksWidget = ({
	url,
	widget,
	isEditing = false,
	onPress,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	onPress?: () => void;
}): ReactElement => {
	const { value } = useFeedWidget({ url, feed: widget.feed });

	return (
		<BaseFeedWidget
			url={url}
			name="Bitcoin Blocks"
			label={value?.height}
			icon={<CubeIcon width={32} height={32} />}
			isEditing={isEditing}
			onPress={onPress}
			right={
				<View style={styles.numbers}>
					<Text01M numberOfLines={1} styles={styles.price}>
						{`${value?.transacionCount} / ${value?.size}`}
					</Text01M>
					<Caption13M styles={styles.change} color="gray1" numberOfLines={1}>
						{value?.time}
					</Caption13M>
				</View>
			}
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
