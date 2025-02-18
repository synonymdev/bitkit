import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import { getBlocksItems } from '../../components/widgets/edit/BlocksItems';
import { getFactsItems } from '../../components/widgets/edit/FactsItems';
import Item from '../../components/widgets/edit/Item';
import { getNewsItems } from '../../components/widgets/edit/NewsItems';
import { getPriceItems } from '../../components/widgets/edit/PriceItems';
import { getWeatherItems } from '../../components/widgets/edit/WeatherItems';
import { useAppDispatch } from '../../hooks/redux';
import { useWidgetOptions } from '../../hooks/useWidgetOptions';
import { RootStackScreenProps } from '../../navigation/types';
import { deleteWidget } from '../../store/slices/widgets';
import {
	TBlocksWidgetOptions,
	TFactsWidgetOptions,
	TNewsWidgetOptions,
	TPriceWidgetOptions,
	TWeatherWidgetOptions,
} from '../../store/types/widgets';
import { ScrollView, View as ThemedView } from '../../styles/components';
import { BodyM } from '../../styles/text';

const WidgetEdit = ({
	route,
	navigation,
}: RootStackScreenProps<'WidgetEdit'>): ReactElement => {
	const { id, initialFields } = route.params;
	const { t } = useTranslation('widgets');
	const dispatch = useAppDispatch();

	const { options, hasEdited, hasEnabledOption, toggleOption, resetOptions } =
		useWidgetOptions(id, initialFields);

	const getItems = () => {
		switch (id) {
			case 'blocks':
				return getBlocksItems(options as TBlocksWidgetOptions);
			case 'facts':
				return getFactsItems(options as TFactsWidgetOptions);
			case 'news':
				return getNewsItems(options as TNewsWidgetOptions);
			case 'price':
				return getPriceItems(options as TPriceWidgetOptions);
			case 'weather':
				return getWeatherItems(options as TWeatherWidgetOptions);
			default:
				return [];
		}
	};

	const items = getItems();

	const onSave = (): void => {
		navigation.popTo('Widget', { id, preview: options });
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
					{t('widget.edit_description', { name: t(`${id}.name`) })}
				</BodyM>

				<ScrollView
					showsVerticalScrollIndicator={false}
					testID="WidgetEditScrollView">
					{items.map((item) => (
						<Item
							key={item.key}
							title={item.title}
							value={item.value}
							isChecked={!!item.isChecked}
							testID={`WidgetEditField-${item.key}`}
							onToggle={() => toggleOption(item)}
						/>
					))}
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
						disabled={!hasEnabledOption}
						testID="WidgetEditPreview"
						onPress={onSave}
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
