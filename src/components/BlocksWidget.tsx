import React, { memo, ReactElement } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Caption13M, Text01M, Text02M } from '../styles/text';
import BaseFeedWidget from './BaseFeedWidget';
import { IWidget } from '../store/types/widgets';
import { useSlashfeed } from '../hooks/widgets';

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
	const { config, fields, loading } = useSlashfeed({
		url,
		fields: widget.fields,
	});

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
				{fields.map((field) => (
					<View key={field.name} style={styles.row}>
						<View style={styles.columnLeft}>
							<Text02M color="gray1" numberOfLines={1}>
								{field.name}
							</Text02M>
						</View>
						<View style={styles.columnRight}>
							<Text01M numberOfLines={1} ellipsizeMode="middle">
								{field.value}
								{field.unit}
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
