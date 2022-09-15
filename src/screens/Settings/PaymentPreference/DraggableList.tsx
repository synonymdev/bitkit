import React, { ReactElement, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
	RenderItemParams,
	ScaleDecorator,
} from 'react-native-draggable-flatlist';

import { View, Text01S, ListIcon } from '../../../styles/components';

type Item = {
	key: string;
	title: string;
};

type DraggableListProps = {
	listData: Item[];
	onDragEnd?: (data: Item[]) => void;
};

const DraggableList = ({
	listData,
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

	return (
		<DraggableFlatList
			data={data}
			keyExtractor={(item): string => item.key}
			renderItem={renderItem}
			onDragEnd={(params): void => {
				setData(params.data);
				onDragEnd && onDragEnd(params.data);
			}}
		/>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		minHeight: 54,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
});

export default DraggableList;
