import React, { memo, ReactElement, useCallback, useState } from 'react';
import {
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';
import DraggableFlatList, {
	DragEndParams,
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { ListIcon } from '../../../styles/icons';
import { BodyM } from '../../../styles/text';

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
					style={styles.container}
					activeOpacity={isActive ? 0.6 : 1}
					disabled={isActive}
					onPressIn={drag}
					onLongPress={drag}>
					<BodyM color="white">{item.title}</BodyM>
					<View>
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
