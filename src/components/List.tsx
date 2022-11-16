import React, { memo, ReactElement, useCallback } from 'react';
import {
	View,
	SectionList,
	StyleProp,
	StyleSheet,
	ViewStyle,
	TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SvgProps } from 'react-native-svg';

import {
	Text01S,
	Caption13Up,
	ChevronRight,
	Checkmark,
	Switch,
	Caption13S,
} from '../styles/components';
import DraggableList from '../screens/Settings/PaymentPreference/DraggableList';

const _ItemHeader = memo(
	({
		title,
		style,
	}: {
		title?: string;
		style?: StyleProp<ViewStyle>;
	}): ReactElement => {
		if (!title) {
			return <View />;
		}

		return (
			<View style={[styles.itemHeader, style]}>
				<Caption13Up color="gray1">{title.toUpperCase()}</Caption13Up>
			</View>
		);
	},
);

const ItemHeader = memo(_ItemHeader, (prevProps, nextProps) => {
	return prevProps.title === nextProps.title;
});

type TItemType = 'switch' | 'button' | 'textButton' | 'draggable';

type TItemDraggable = {
	key: string;
	title: string;
};

export type ItemData = {
	title: string;
	type: TItemType;
	value?: string | boolean | TItemDraggable[];
	disabled?: boolean;
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
		disabled = false,
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
				<TouchableOpacity
					style={styles.item}
					activeOpacity={0.6}
					onPress={_onPress}>
					<View style={styles.leftColumn}>
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
					<View style={styles.rightColumn}>
						<Switch onValueChange={_onPress} value={enabled} />
					</View>
				</TouchableOpacity>
			);
		}

		if (type === 'textButton') {
			const _onPress = (): void => onPress && onPress(navigation);

			return (
				<TouchableOpacity
					style={styles.item}
					activeOpacity={0.6}
					onPress={enabled ? _onPress : undefined}>
					<View style={styles.leftColumn}>
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
					<View style={styles.rightColumn}>
						<Text01S color="gray1">{value}</Text01S>
					</View>
				</TouchableOpacity>
			);
		}

		if (type === 'draggable') {
			return (
				<DraggableList
					style={styles.draggableList}
					listData={value as TItemDraggable[]}
					onDragEnd={onDragEnd}
				/>
			);
		}

		if (type === 'button') {
			const useCheckmark = typeof value === 'boolean';
			const _onPress = (): void => onPress && onPress(navigation);

			return (
				<TouchableOpacity
					style={styles.item}
					activeOpacity={0.6}
					disabled={disabled}
					onPress={enabled ? _onPress : undefined}>
					<View style={styles.leftColumn}>
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
					<View style={styles.rightColumn}>
						{useCheckmark ? (
							value && <Checkmark color="brand" width={27} height={27} />
						) : (
							<>
								<Text01S style={styles.valueText}>{value}</Text01S>
								<ChevronRight color="gray1" width={24} height={15} />
							</>
						)}
					</View>
				</TouchableOpacity>
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
		prevProps.disabled === nextProps.disabled &&
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
				({ section: { title } }): ReactElement => {
					const isFirst = title === data[0].title;
					return (
						<ItemHeader
							title={title}
							style={!isFirst ? styles.sectionSpacing : {}}
						/>
					);
				},
				[data],
			)}
			renderItem={useCallback(({ item }): ReactElement | null => {
				if (item.hide) {
					return null;
				}
				return <Item {...item} navigation={navigation} />;
				// eslint-disable-next-line react-hooks/exhaustive-deps
			}, [])}
			stickySectionHeadersEnabled={false}
			contentContainerStyle={style}
			bounces={bounces}
		/>
	);
};

const styles = StyleSheet.create({
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		minHeight: 56,
	},
	itemHeader: {
		justifyContent: 'center',
	},
	valueText: {
		marginRight: 15,
	},
	leftColumn: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
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
	draggableList: {
		marginTop: 14,
	},
	sectionSpacing: {
		marginTop: 27,
	},
});

export default memo(List);
