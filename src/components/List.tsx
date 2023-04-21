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
import isEqual from 'lodash.isequal';

import { Switch } from '../styles/components';
import { Text01S, Caption13Up, Caption13S } from '../styles/text';
import { ChevronRight, Checkmark } from '../styles/icons';
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

export enum EItemType {
	switch = 'switch',
	button = 'button',
	textButton = 'textButton',
	draggable = 'draggable',
}

type TItemDraggable = {
	key: string;
	title: string;
};

export type ItemData = SwitchItem | ButtonItem | TextButtonItem | DraggableItem;

export type SwitchItem = {
	type: EItemType.switch;
	title: string;
	Icon?: React.FC<SvgProps>;
	iconColor?: string;
	enabled?: boolean;
	hide?: boolean;
	onPress?: Function;
	testID?: string;
};

export type ButtonItem = {
	type: EItemType.button;
	value?: string | boolean;
	title: string;
	description?: string;
	Icon?: React.FC<SvgProps>;
	iconColor?: string;
	disabled?: boolean;
	enabled?: boolean;
	hide?: boolean;
	onPress?: Function;
	testID?: string;
};

export type TextButtonItem = {
	type: EItemType.textButton;
	value: string;
	title: string;
	description?: string;
	Icon?: React.FC<SvgProps>;
	iconColor?: string;
	enabled?: boolean;
	hide?: boolean;
	onPress?: Function;
	testID?: string;
};

export type DraggableItem = {
	type: EItemType.draggable;
	value: TItemDraggable[];
	title: string;
	hide?: boolean;
	onDragEnd?: (data: TItemDraggable[]) => void;
	testID?: string;
};

const _Item = memo((item: ItemData): ReactElement => {
	const navigation = useNavigation();
	const type = item.type;
	const hide = item.hide ?? false;

	if (hide) {
		return <></>;
	}

	if (type === 'switch') {
		const {
			title,
			enabled = true,
			Icon,
			iconColor,
			onPress,
			testID,
		} = item as SwitchItem;

		const _onPress = (): void => onPress?.();

		return (
			<TouchableOpacity
				style={styles.item}
				activeOpacity={0.6}
				onPress={_onPress}
				testID={testID}>
				<View style={styles.leftColumn}>
					{Icon && (
						<Icon
							style={styles.icon}
							viewBox="0 0 32 32"
							height={32}
							width={32}
							color={iconColor ? iconColor : 'brand'}
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
		const {
			title,
			description,
			value,
			enabled = true,
			Icon,
			iconColor,
			onPress,
			testID,
		} = item as TextButtonItem;

		const _onPress = (): void => onPress?.(navigation);

		return (
			<TouchableOpacity
				disabled={!enabled}
				style={styles.item}
				activeOpacity={0.6}
				onPress={_onPress}
				testID={testID}>
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
		const { value, onDragEnd } = item as DraggableItem;
		return (
			<DraggableList
				style={styles.draggableList}
				listData={value}
				onDragEnd={onDragEnd}
			/>
		);
	}

	if (type === 'button') {
		const {
			value,
			title,
			description,
			disabled = false,
			enabled = true,
			Icon,
			iconColor,
			onPress,
			testID,
		} = item as ButtonItem;

		const useCheckmark = typeof value === 'boolean';
		const _onPress = (): void => onPress?.(navigation);

		return (
			<TouchableOpacity
				// eslint-disable-next-line react-native/no-inline-styles
				style={[styles.item, { opacity: enabled ? 1 : 0.5 }]}
				activeOpacity={0.6}
				disabled={disabled}
				onPress={enabled ? _onPress : undefined}
				testID={testID}>
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
							<Text01S testID="Value" style={styles.valueText}>
								{value}
							</Text01S>
							<ChevronRight color="gray1" width={24} height={15} />
						</>
					)}
				</View>
			</TouchableOpacity>
		);
	}

	return <></>;
});

const Item = memo(_Item, (prevProps, nextProps) => {
	return isEqual(prevProps, nextProps);
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
	onScrollDownChange?: (value: boolean) => void;
}): ReactElement => {
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
			keyExtractor={(item, index): string => `${item.title}-${index}`}
			renderSectionHeader={useCallback(
				({
					section: { title },
				}: {
					section: { title: string };
				}): ReactElement => {
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
			renderItem={useCallback(
				({ item }: { item: ItemData }): ReactElement | null => {
					return item.hide ? null : <Item {...item} />;
				},
				[],
			)}
			stickySectionHeadersEnabled={false}
			contentContainerStyle={style}
			bounces={bounces}
			testID="List"
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
