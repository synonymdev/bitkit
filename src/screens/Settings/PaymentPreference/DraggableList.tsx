import React, { memo, ReactElement, useCallback, useState } from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	ViewStyle,
} from 'react-native';
import DraggableFlatList, {
	DragEndParams,
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { View } from '../../../styles/components';
import { Text01S } from '../../../styles/text';
import { ListIcon } from '../../../styles/icons';

type Item = {
	key: string;
	title: string;
};

type DraggableListProps = {
	listData: Item[];
	style?: StyleProp<ViewStyle>;
	onDragEnd?: (data: Item[]) => void;
};

const DraggableList = ({
	listData,
	style,
	onDragEnd,
}: DraggableListProps): ReactElement => {
	const [data, setData] = useState(listData);

	const renderItem = ({
		item,
		drag,
		isActive,
	}: RenderItemParams<Item>): ReactElement => {
		return (
			<ScaleDecorator>
				<TouchableOpacity
					onLongPress={drag}
					disabled={isActive}
					activeOpacity={isActive ? 0.6 : 1}
					style={styles.container}>
					<Text01S color="white">{item.title}</Text01S>
					<View color="transparent">
						<ListIcon height={24} width={24} />
					</View>
				</TouchableOpacity>
			</ScaleDecorator>
		);
	};
	const _onDragEnd = useCallback(
		(params: DragEndParams<Item>): void => {
			setData(params.data);
			onDragEnd?.(params.data);
		},
		[onDragEnd],
	);

	return (
		<DraggableFlatList
			style={style}
			data={data}
			keyExtractor={(item): string => item.key}
			renderItem={renderItem}
			onDragEnd={_onDragEnd}
		/>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 57,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
});

export default memo(DraggableList);
