import React, { memo, ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';

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
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { value } = useFeedWidget({ url, feed: widget.feed });

	return (
		<BaseFeedWidget
			url={url}
			name="Bitcoin Blocks"
			label={value?.height || ''}
			icon={<CubeIcon width={32} height={32} />}
			isEditing={isEditing}
			onLongPress={onLongPress}
			onPressIn={onPressIn}
			right={
				<View style={styles.numbers}>
					{value && (
						<>
							<Text01M numberOfLines={1} styles={styles.price}>
								{`${value?.transacionCount} / ${value?.size}`}
							</Text01M>
							<Caption13M
								styles={styles.change}
								color="gray1"
								numberOfLines={1}>
								{value?.time}
							</Caption13M>
						</>
					)}
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
