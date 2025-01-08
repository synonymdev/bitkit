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

import {
	BodyM,
	BodyMSB,
	BodyS,
	BodySSB,
	Caption13Up,
	Caption,
} from '../styles/text';
import { ChevronRight, Checkmark } from '../styles/icons';
import Switch from '../components/Switch';
import DraggableList from '../screens/Settings/PaymentPreference/DraggableList';

const _SectionHeader = memo(
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
			<View style={[styles.sectionHeader, style]}>
				<Caption13Up color="secondary">{title.toUpperCase()}</Caption13Up>
			</View>
		);
	},
);

const _SectionFooter = memo(
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
			<View style={[styles.sectionFooter, style]}>
				<BodyS color="secondary">{description}</BodyS>
			</View>
		);
	},
);

const SectionHeader = memo(_SectionHeader, (prevProps, nextProps) => {
	return prevProps.title === nextProps.title;
});

const SectionFooter = memo(_SectionFooter, (prevProps, nextProps) => {
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
	enabled: boolean;
	title: string;
	Icon?: React.FC<SvgProps>;
	iconColor?: string;
	disabled?: boolean;
	hide?: boolean;
	testID?: string;
	onPress?: () => void;
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
	loading?: boolean;
	hide?: boolean;
	testID?: string;
	onPress?: () => void;
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
	testID?: string;
	onPress?: () => void;
};

export type DraggableItem = {
	type: EItemType.draggable;
	value: TItemDraggable[];
	title: string;
	hide?: boolean;
	testID?: string;
	onDragEnd?: (data: TItemDraggable[]) => void;
};

const _Item = memo((item: ItemData): ReactElement => {
	const type = item.type;
	const hide = item.hide ?? false;

	if (hide) {
		return <></>;
	}

	if (type === EItemType.switch) {
		const { title, enabled, disabled, Icon, iconColor, onPress, testID } =
			item as SwitchItem;

		const _onPress = (): void => onPress?.();

		return (
			<TouchableOpacity
				style={styles.row}
				activeOpacity={0.7}
				disabled={disabled}
				testID={testID}
				onPress={_onPress}>
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
					<BodyM color="white">{title}</BodyM>
				</View>
				<View style={styles.rightColumn}>
					<Switch
						value={enabled}
						disabled={disabled}
						onValueChange={_onPress}
					/>
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
				activeOpacity={0.7}
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
						<BodyM color="white">{title}</BodyM>
						{description && (
							<View>
								<Caption color="secondary">{description}</Caption>
							</View>
						)}
					</View>
				</View>
				<View style={styles.rightColumn}>
					<BodyM color="secondary">{value}</BodyM>
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
				activeOpacity={0.7}
				disabled={disabled}
				testID={testID}
				onPress={enabled ? _onPress : undefined}>
				<View
					style={[
						styles.row,
						subtitle ? styles.rowLarge : {},
						subtitle && Icon ? styles.rowXlarge : {},
					]}>
					<View style={styles.leftColumn}>
						{Icon && (
							<View style={styles.icon}>
								<Icon
									height={32}
									width={32}
									color={iconColor !== '' ? iconColor : 'brand'}
								/>
							</View>
						)}

						{subtitle ? (
							<View>
								<BodyMSB color="white">{title}</BodyMSB>
								{subtitle && <BodySSB color="secondary">{subtitle}</BodySSB>}
							</View>
						) : (
							<View>
								<BodyM color="white">{title}</BodyM>
							</View>
						)}
					</View>
					<View style={styles.rightColumn}>
						{useCheckmark ? (
							loading && value ? (
								<ActivityIndicator color="white" />
							) : (
								value && <Checkmark color="brand" width={32} height={32} />
							)
						) : (
							<>
								<BodyM style={styles.valueText} testID="Value">
									{value}
								</BodyM>
								<ChevronRight color="secondary" width={24} height={24} />
							</>
						)}
					</View>
				</View>

				{description && (
					<BodyS style={styles.description} color="secondary">
						{description}
					</BodyS>
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
						<SectionHeader
							title={title}
							style={!isFirst ? styles.sectionSpacing : {}}
						/>
					);
				},
				[data],
			)}
			renderSectionFooter={({ section }): ReactElement => {
				const { description } = section;
				return <SectionFooter description={description} />;
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
	sectionHeader: {
		justifyContent: 'center',
		// height: 40,
		height: 50,
	},
	sectionFooter: {
		marginTop: 16,
		paddingBottom: 16,
		justifyContent: 'center',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomWidth: 1,
	},
	sectionSpacing: {
		marginTop: 16,
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
		minHeight: 52,
	},
	rowLarge: {
		minHeight: 74,
	},
	rowXlarge: {
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
		borderRadius: 20,
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	description: {
		marginVertical: 4,
	},
});

export default memo(List);
