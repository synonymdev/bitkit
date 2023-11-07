import React, { memo, ReactElement, useEffect, useState } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Reader } from '@synonymdev/slashtags-widget-bitcoin-feed';

import { Caption13M, Text01M, Text02M } from '../styles/text';
import BaseFeedWidget from './BaseFeedWidget';
import { IWidget } from '../store/types/widgets';
import { useSlashfeed } from '../hooks/widgets';
import { decodeWidgetFieldValue, SUPPORTED_FEED_TYPES } from '../utils/widgets';
import { useSlashtags2 } from '../hooks/slashtags2';
import { __E2E__ } from '../constants/env';

const mapping = {
	Block: 'height',
	Time: 'timestamp',
	Date: 'timestamp',
	Transactions: 'transactionCount',
	Size: 'size',
	Difficulty: 'difficulty',
	Weight: 'weight',
	Hash: 'hash',
	'Merkle Root': 'merkleRoot',
};

const BlocksWidget = ({
	url,
	widget,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	url: string;
	widget: IWidget;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('slashtags');
	const { webRelayClient, webRelayUrl } = useSlashtags2();
	const { config, fields, loading } = useSlashfeed({ url });
	const [data, setData] = useState(fields);

	useEffect(() => {
		const feedUrl = `${url}?relay=${webRelayUrl}`;
		const reader = new Reader(webRelayClient, feedUrl);

		const getData = async (): Promise<void> => {
			try {
				const promises = widget.fields.map(async (field) => {
					const fieldName = field.main.replace('/feed/', '');
					const value = await reader.getField(fieldName);
					const formattedValue = decodeWidgetFieldValue(
						SUPPORTED_FEED_TYPES.BLOCKS_FEED,
						field,
						value,
					);
					return {
						name: field.name as string,
						value: formattedValue as string,
					};
				});

				const values = await Promise.all(promises);
				setData(values);
			} catch (error) {
				console.error(error);
			}
		};

		// get data once then subscribe to updates
		getData();

		let unsubscribe: () => void;

		// subscriptions are breaking e2e tests
		if (!__E2E__) {
			unsubscribe = reader.subscribeBlockInfo((blockInfo) => {
				const values = widget.fields.map((field) => {
					const value = blockInfo[mapping[field.name]];
					const formattedValue = decodeWidgetFieldValue(
						SUPPORTED_FEED_TYPES.BLOCKS_FEED,
						field,
						value,
					);
					return { name: field.name, value: formattedValue };
				});

				setData(values);
			});
		}

		return () => {
			unsubscribe();
		};
	}, [url, widget.fields, webRelayUrl, webRelayClient]);

	return (
		<BaseFeedWidget
			style={style}
			url={url}
			name={t('widget_blocks')}
			isLoading={loading}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			<>
				{data.map((field) => (
					<View key={field.name} style={styles.row}>
						<View style={styles.columnLeft}>
							<Text02M color="gray1" numberOfLines={1}>
								{field.name}
							</Text02M>
						</View>
						<View style={styles.columnRight}>
							<Text01M numberOfLines={1} ellipsizeMode="middle">
								{field.value}
							</Text01M>
						</View>
					</View>
				))}

				{widget.extras?.showSource && config?.source && (
					<View style={styles.source}>
						<View style={styles.columnLeft}>
							<Caption13M color="gray1" numberOfLines={1}>
								{t('widget_source')}
							</Caption13M>
						</View>
						<View style={styles.columnRight}>
							<Caption13M color="gray1" numberOfLines={1}>
								{config.source.name}
							</Caption13M>
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

export default memo(BlocksWidget);
