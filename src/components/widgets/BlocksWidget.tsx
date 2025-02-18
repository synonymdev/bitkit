import React, { memo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { __E2E__ } from '../../constants/env';
import useBlocksWidget from '../../hooks/useBlocksWidget';
import { TBlocksWidgetOptions } from '../../store/types/widgets';
import { BodyMSB, BodySSB, CaptionB } from '../../styles/text';
import BaseWidget from './BaseWidget';

export const blocksMapping = {
	height: 'Block',
	time: 'Time',
	date: 'Date',
	transactionCount: 'Transactions',
	size: 'Size',
	weight: 'Weight',
	difficulty: 'Difficulty',
	hash: 'Hash',
	merkleRoot: 'Merkle Root',
};

const BlocksWidget = ({
	options,
	isEditing = false,
	style,
	testID,
	onLongPress,
	onPressIn,
}: {
	options: TBlocksWidgetOptions;
	isEditing?: boolean;
	style?: StyleProp<ViewStyle>;
	testID?: string;
	onLongPress?: () => void;
	onPressIn?: () => void;
}): ReactElement => {
	const { t } = useTranslation('widgets');
	const { data, status } = useBlocksWidget();

	return (
		<BaseWidget
			id="blocks"
			style={style}
			// isLoading={status === 'loading'}
			isEditing={isEditing}
			testID={testID}
			onPressIn={onPressIn}
			onLongPress={onLongPress}>
			{status === 'ready' && (
				<>
					{Object.entries(data)
						.filter(([key]) => options[key])
						.map(([key, value]) => (
							<View key={key} style={styles.row}>
								<View style={styles.columnLeft}>
									<BodySSB color="secondary" numberOfLines={1}>
										{blocksMapping[key]}
									</BodySSB>
								</View>
								<View style={styles.columnRight}>
									<BodyMSB numberOfLines={1} ellipsizeMode="middle">
										{value}
									</BodyMSB>
								</View>
							</View>
						))}

					{options.showSource && (
						<View style={styles.source}>
							<View style={styles.columnLeft}>
								<CaptionB color="secondary" numberOfLines={1}>
									{t('widget.source')}
								</CaptionB>
							</View>
							<View style={styles.columnRight}>
								<CaptionB color="secondary" numberOfLines={1}>
									mempool.space
								</CaptionB>
							</View>
						</View>
					)}
				</>
			)}
		</BaseWidget>
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
