import isEqual from 'lodash/isEqual';
import React, { useState, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import Divider from '../../components/Divider';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import { useDisplayValues } from '../../hooks/displayValues';
import { useAppDispatch } from '../../hooks/redux';
import type { RootStackScreenProps } from '../../navigation/types';
import { deleteWidget } from '../../store/slices/widgets';
import { TWidgetOptions } from '../../store/types/widgets';
import { ScrollView, View as ThemedView } from '../../styles/components';
import { Checkmark } from '../../styles/icons';
import { BodyM, BodySSB, Title } from '../../styles/text';

export const getDefaultOptions = (_id: string): TWidgetOptions => {
	return {
		showStatus: true,
		showText: true,
		showMedian: true,
		showNextBlockFee: true,
	};
};

interface ItemProps {
	title: string | ReactElement;
	value?: string;
	isChecked: boolean;
	onToggle: () => void;
}

const Item = ({
	title,
	value,
	isChecked,
	onToggle,
}: ItemProps): ReactElement => (
	<Pressable onPress={onToggle}>
		<View style={styles.row}>
			<View style={styles.rowLeft}>
				{typeof title === 'string' ? (
					<BodySSB color="secondary">{title}</BodySSB>
				) : (
					title
				)}
			</View>
			{value && (
				<View style={styles.rowRight}>
					<BodySSB numberOfLines={1} ellipsizeMode="middle">
						{value}
					</BodySSB>
				</View>
			)}
			<Checkmark
				style={styles.checkmark}
				color={isChecked ? 'brand' : 'gray3'}
				height={30}
				width={30}
			/>
		</View>
		<Divider />
	</Pressable>
);

const useWidgetOptions = (id: string, initialFields: TWidgetOptions) => {
	const [options, setOptions] = useState(initialFields);
	const defaultOptions = getDefaultOptions(id);
	const hasEdited = !isEqual(options, defaultOptions);
	const hasEnabledOption = Object.values(options).some(Boolean);

	const toggleOption = (key: keyof TWidgetOptions) => {
		setOptions((prevState) => ({
			...prevState,
			[key]: !prevState[key],
		}));
	};

	const resetOptions = () => {
		setOptions(defaultOptions);
	};

	return { options, hasEdited, hasEnabledOption, toggleOption, resetOptions };
};

const WidgetEdit = ({
	navigation,
	route,
}: RootStackScreenProps<'WidgetEdit'>): ReactElement => {
	const { id, initialFields } = route.params;
	const { t } = useTranslation('widgets');
	const dispatch = useAppDispatch();
	const { options, hasEdited, hasEnabledOption, toggleOption, resetOptions } =
		useWidgetOptions(id, initialFields);

	const widget = { name: t(`${id}.name`) };

	const data = {
		condition: 'good',
		currentFee: 342,
		nextBlockFee: 8,
	};
	const { condition, currentFee, nextBlockFee } = data;
	const currentFeeFiat = useDisplayValues(currentFee);

	const items = [
		{
			key: 'showStatus' as const,
			title: <Title>{t(`weather.condition.${condition}.title`)}</Title>,
		},
		{
			key: 'showText' as const,
			title: <BodyM>{t(`weather.condition.${condition}.description`)}</BodyM>,
		},
		{
			key: 'showMedian' as const,
			title: t('weather.current_fee'),
			value: `${currentFeeFiat.fiatSymbol} ${currentFeeFiat.fiatFormatted}`,
		},
		{
			key: 'showNextBlockFee' as const,
			title: t('weather.next_block'),
			value: `${nextBlockFee} ₿/vByte`,
		},
	];

	const onSave = (): void => {
		navigation.navigate('Widget', { id, preview: options });
	};

	const onReset = (): void => {
		dispatch(deleteWidget(id));
		resetOptions();
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('widget.edit')} />

			<View style={styles.content}>
				<BodyM style={styles.description} color="secondary">
					{t('widget.edit_description', { name: widget.name })}
				</BodyM>

				<ScrollView
					showsVerticalScrollIndicator={false}
					testID="WidgetEditScrollView">
					<View style={styles.fields}>
						{items.map((item) => (
							<Item
								key={item.key}
								title={item.title}
								value={item.value}
								isChecked={options[item.key]}
								onToggle={() => toggleOption(item.key)}
							/>
						))}
					</View>
				</ScrollView>

				<View style={styles.buttonsContainer}>
					<Button
						style={styles.button}
						text={t('reset')}
						variant="secondary"
						size="large"
						disabled={!hasEdited}
						testID="WidgetEditReset"
						onPress={onReset}
					/>
					<Button
						style={styles.button}
						text={t('preview')}
						size="large"
						testID="WidgetEditPreview"
						onPress={onSave}
						disabled={!hasEnabledOption}
					/>
				</View>
			</View>
			<SafeAreaInset type="bottom" minPadding={16} />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
	},
	description: {
		marginBottom: 32,
	},
	loading: {
		marginTop: 16,
	},
	fields: {
		paddingBottom: 16,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	rowLeft: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
	},
	rowRight: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	checkmark: {
		marginLeft: 16,
	},
	buttonsContainer: {
		flexDirection: 'row',
		marginTop: 'auto',
		paddingTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
});

export default WidgetEdit;
