import React, { memo, ReactElement, useCallback } from 'react';
import { SectionList, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgProps } from 'react-native-svg';

import {
	Text01S,
	Caption13Up,
	View,
	ChevronRight,
	Checkmark,
	Switch,
	Caption13S,
} from '../styles/components';
import Card from './Card';
import DraggableList from '../screens/Settings/PaymentPreference/DraggableList';

const _ItemHeader = memo(({ title }: { title?: string }): ReactElement => {
	if (!title) {
		return <View />;
	}

	return (
		<View color={'transparent'} style={styles.itemHeader}>
			<Caption13Up color="gray1">{title.toUpperCase()}</Caption13Up>
		</View>
	);
});

const ItemHeader = memo(_ItemHeader, (prevProps, nextProps) => {
	return prevProps.title === nextProps.title;
});

type TItemType = 'switch' | 'button' | 'textButton' | 'draggable';

type TItemDraggable = {
	key: string;
	title: string;
};

type ItemData = {
	title: string;
	type: TItemType;
	value?: string | boolean | TItemDraggable[];
	enabled?: boolean;
	hide?: boolean;
	Icon?: React.FC<SvgProps>;
	iconColor?: string;
	description?: string;
	onPress?: Function;
	onDragEnd?: (data: TItemDraggable[]) => void;
};

interface IItem extends ItemData {
	navigation: Object;
	type: TItemType;
}

const _Item = memo(
	({
		type,
		title,
		value,
		navigation,
		enabled = true,
		hide = false,
		Icon,
		iconColor,
		description,
		onPress,
		onDragEnd,
	}: IItem): ReactElement => {
		if (hide) {
			return <></>;
		}

		if (type === 'switch') {
			const _onPress = (): void => onPress && onPress();

			return (
				<View
					color="transparent"
					style={description ? styles.descriptionRow : styles.row}>
					<Card style={styles.card} onPress={_onPress}>
						<View color="transparent" style={styles.leftColumn}>
							{Icon && (
								<Icon
									style={styles.icon}
									viewBox="0 0 32 32"
									height={32}
									width={32}
									color={iconColor !== '' ? iconColor : 'brand'}
								/>
							)}
							<Text01S color="white">{title}</Text01S>
						</View>
						<View color="transparent" style={styles.rightColumn}>
							<Switch onValueChange={_onPress} value={enabled} />
						</View>
					</Card>
				</View>
			);
		}
		if (type === 'textButton') {
			const _onPress = (): void => onPress && onPress(navigation);

			return (
				<View
					color="transparent"
					style={description ? styles.descriptionRow : styles.row}>
					<Card style={styles.card} onPress={enabled ? _onPress : undefined}>
						<View color="transparent" style={styles.leftColumn}>
							{Icon && (
								<Icon
									style={styles.icon}
									viewBox="0 0 32 32"
									height={32}
									width={32}
									color={iconColor !== '' ? iconColor : 'brand'}
								/>
							)}
							<View>
								<Text01S color="white">{title}</Text01S>
								{description && (
									<View>
										<Caption13S color="gray1">{description}</Caption13S>
									</View>
								)}
							</View>
						</View>
						<View color="transparent" style={styles.rightColumn}>
							<Text01S color={'gray1'}>{value}</Text01S>
						</View>
					</Card>
				</View>
			);
		}

		if (type === 'draggable') {
			return (
				<DraggableList
					listData={value as TItemDraggable[]}
					onDragEnd={onDragEnd}
				/>
			);
		}

		if (type === 'button') {
			const useCheckmark = typeof value === 'boolean';
			const _onPress = (): void => onPress && onPress(navigation);

			return (
				<View
					color="transparent"
					style={description ? styles.descriptionRow : styles.row}>
					<Card style={styles.card} onPress={enabled ? _onPress : undefined}>
						<View color="transparent" style={styles.leftColumn}>
							{Icon && (
								<View style={styles.icon}>
									<Icon
										viewBox="0 0 32 32"
										height={32}
										width={32}
										color={iconColor !== '' ? iconColor : 'brand'}
									/>
								</View>
							)}
							<View>
								<Text01S color="white">{title}</Text01S>
								{description && (
									<View>
										<Caption13S color="gray1">{description}</Caption13S>
									</View>
								)}
							</View>
						</View>
						<View color="transparent" style={styles.rightColumn}>
							{useCheckmark ? (
								value ? (
									<Checkmark color="brand" height={22} width={22} />
								) : null
							) : (
								<>
									<Text01S style={styles.valueText}>{value}</Text01S>
									<ChevronRight color={'gray1'} />
								</>
							)}
						</View>
					</Card>
				</View>
			);
		}

		return <></>;
	},
);
const Item = memo(_Item, (prevProps, nextProps) => {
	return (
		prevProps.title === nextProps.title &&
		prevProps.value === nextProps.value &&
		prevProps.type === nextProps.type &&
		prevProps.enabled === nextProps.enabled &&
		prevProps.Icon === nextProps.Icon
	);
});

export interface IListData {
	title?: string;
	data: ItemData[];
}

const List = ({
	data,
	style,
	bounces,
	onScrollDownChange,
}: {
	data: IListData[];
	style?: StyleProp<ViewStyle>;
	bounces?: boolean;
	onScrollDownChange?: (boolean) => void;
}): ReactElement => {
	const navigation = useNavigation();

	return (
		<SectionList
			onScroll={
				onScrollDownChange
					? (e): void => onScrollDownChange(e.nativeEvent.contentOffset.y > 15)
					: undefined
			}
			// @ts-ignore section title is not optional but it works
			sections={data}
			extraData={data}
			keyExtractor={(item): string => item.title}
			renderSectionHeader={useCallback(
				({ section: { title } }): ReactElement => (
					<ItemHeader title={title} />
				),
				[],
			)}
			renderItem={useCallback(({ item }): ReactElement | null => {
				if (item.hide === false) {
					return <Item {...item} navigation={navigation} />;
				}
				return null;
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [])}
			stickySectionHeadersEnabled={false}
			contentContainerStyle={style}
			bounces={bounces}
		/>
	);
};

const styles = StyleSheet.create({
	row: {
		height: 55,
	},
	descriptionRow: {
		height: 65,
	},
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 0,
		paddingVertical: 0,
		minHeight: 51,
		backgroundColor: 'rgba(255, 255, 255, 0)',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		borderRadius: 0,
	},
	itemHeader: {
		marginTop: 27,
		justifyContent: 'center',
	},
	valueText: {
		marginRight: 15,
	},
	leftColumn: {
		justifyContent: 'flex-end',
		flexDirection: 'row',
	},
	rightColumn: {
		alignItems: 'center',
		flexDirection: 'row',
	},
	icon: {
		borderRadius: 200,
		marginRight: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default memo(List);
