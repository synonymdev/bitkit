import React, { memo, ReactElement, useCallback } from 'react';
import {
	View,
	SectionList,
	StyleProp,
	StyleSheet,
	ViewStyle,
	TouchableOpacity,
	ActivityIndicator,
} from 'react-native';
import { SvgProps } from 'react-native-svg';
import isEqual from 'lodash/isEqual';

import { Switch } from '../styles/components';
import {
	Text01S,
	Text01M,
	Text02S,
	Text02M,
	Caption13Up,
	Caption13S,
} from '../styles/text';
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

const _ItemFooter = memo(
	({
		description,
		style,
	}: {
		description?: string;
		style?: StyleProp<ViewStyle>;
	}): ReactElement => {
		if (!description) {
			return <View />;
		}

		return (
			<View style={[styles.itemFooter, style]}>
				<Text02S color="gray1">{description}</Text02S>
			</View>
		);
	},
);

const ItemHeader = memo(_ItemHeader, (prevProps, nextProps) => {
	return prevProps.title === nextProps.title;
});

const ItemFooter = memo(_ItemFooter, (prevProps, nextProps) => {
	return prevProps.description === nextProps.description;
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
	onPress?: () => void;
	testID?: string;
};

export type ButtonItem = {
	type: EItemType.button;
	value?: string | boolean;
	title: string;
	subtitle?: string;
	description?: string;
	Icon?: React.FC<SvgProps>;
	iconColor?: string;
	disabled?: boolean;
	enabled?: boolean;
	hide?: boolean;
	onPress?: () => void;
	testID?: string;
	loading?: boolean;
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
	onPress?: () => void;
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
	const type = item.type;
	const hide = item.hide ?? false;

	if (hide) {
		return <></>;
	}

	if (type === EItemType.switch) {
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
				style={styles.row}
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

	if (type === EItemType.textButton) {
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

		const _onPress = (): void => onPress?.();

		return (
			<TouchableOpacity
				disabled={!enabled}
				style={styles.row}
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

	if (type === EItemType.draggable) {
		const { value, onDragEnd } = item as DraggableItem;
		return <DraggableList listData={value} onDragEnd={onDragEnd} />;
	}

	if (type === EItemType.button) {
		const {
			value,
			title,
			subtitle,
			description,
			disabled = false,
			enabled = true,
			Icon,
			iconColor,
			onPress,
			testID,
			loading,
		} = item as ButtonItem;

		const useCheckmark = typeof value === 'boolean';
		const _onPress = (): void => onPress?.();

		return (
			<TouchableOpacity
				style={
					// eslint-disable-next-line react-native/no-inline-styles
					{ opacity: enabled ? 1 : 0.5 }
				}
				activeOpacity={0.6}
				disabled={disabled}
				testID={testID}
				onPress={enabled ? _onPress : undefined}>
				<View style={[styles.row, subtitle ? styles.rowLarge : {}]}>
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

						{subtitle ? (
							<View>
								<Text01M color="white">{title}</Text01M>
								{subtitle && <Text02M color="gray1">{subtitle}</Text02M>}
							</View>
						) : (
							<View>
								<Text01S color="white">{title}</Text01S>
							</View>
						)}
					</View>
					<View style={styles.rightColumn}>
						{useCheckmark ? (
							loading && value ? (
								<ActivityIndicator color={'white'} />
							) : (
								value && <Checkmark color="brand" width={32} height={32} />
							)
						) : (
							<>
								<Text01S style={styles.valueText} testID="Value">
									{value}
								</Text01S>
								<ChevronRight color="gray1" width={24} height={24} />
							</>
						)}
					</View>
				</View>

				{description && (
					<Text02S style={styles.description} color="gray1">
						{description}
					</Text02S>
				)}
			</TouchableOpacity>
		);
	}

	return <></>;
});

const Item = memo(_Item, (prevProps, nextProps) => {
	return isEqual(prevProps, nextProps);
});

export interface IListData {
	data: ItemData[];
	title?: string;
	description?: string;
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
			sections={data}
			extraData={data}
			keyExtractor={(item, index): string => `${item.title}-${index}`}
			showsVerticalScrollIndicator={false}
			renderSectionHeader={useCallback(
				({ section }): ReactElement => {
					const { title } = section;
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
			renderSectionFooter={({ section }): ReactElement => {
				const { description } = section;
				return <ItemFooter description={description} />;
			}}
			renderItem={useCallback(
				({ item }: { item: ItemData }): ReactElement | null => {
					return item.hide ? null : <Item {...item} />;
				},
				[],
			)}
			stickySectionHeadersEnabled={false}
			contentContainerStyle={style}
			keyboardShouldPersistTaps="handled"
			bounces={bounces}
			testID="List"
		/>
	);
};

const styles = StyleSheet.create({
	itemHeader: {
		marginBottom: 10,
		justifyContent: 'center',
	},
	itemFooter: {
		marginTop: 16,
		paddingBottom: 16,
		justifyContent: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	valueText: {
		marginRight: 8,
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
		minHeight: 58,
	},
	rowLarge: {
		minHeight: 90,
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
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	description: {
		marginTop: 4,
	},
	sectionSpacing: {
		marginTop: 32,
	},
});

export default memo(List);
