import { isEqual } from 'lodash';
import React, { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import BlocksWidget from '../../components/widgets/BlocksWidget';
import CalculatorWidget from '../../components/widgets/CalculatorWidget';
import FactsWidget from '../../components/widgets/FactsWidget';
import NewsWidget from '../../components/widgets/NewsWidget';
import PriceWidget from '../../components/widgets/PriceWidget';
import WeatherWidget from '../../components/widgets/WeatherWidget';
import { widgets } from '../../constants/widgets';
import { useCurrency } from '../../hooks/displayValues';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import type { RootStackScreenProps } from '../../navigation/types';
import { widgetSelector } from '../../store/reselect/widgets';
import { deleteWidget, saveWidget } from '../../store/slices/widgets';
import {
	TBlocksWidgetOptions,
	TFactsWidgetOptions,
	TNewsWidgetOptions,
	TPriceWidgetOptions,
	TWeatherWidgetOptions,
	TWidgetOptions,
} from '../../store/types/widgets';
import {
	ScrollView,
	View as ThemedView,
	TouchableOpacity,
} from '../../styles/components';
import { ChevronRight } from '../../styles/icons';
import { BodyM, Caption13Up, Headline } from '../../styles/text';
import { getDefaultOptions } from '../../utils/widgets';

const Widget = ({
	navigation,
	route,
}: RootStackScreenProps<'Widget'>): ReactElement => {
	const { id, preview } = route.params;
	const { t } = useTranslation('widgets');
	const dispatch = useAppDispatch();
	const { fiatSymbol } = useCurrency();
	const savedWidget = useAppSelector((state) => {
		return widgetSelector(state, id);
	}) as TWidgetOptions;

	const widget = {
		name: t(`${id}.name`),
		description: t(`${id}.description`, { fiatSymbol }),
		icon: widgets[id].icon,
	};

	const defaultOptions = getDefaultOptions(id);
	const hasOptions = Object.keys(defaultOptions).length > 0;
	const options = preview ?? savedWidget ?? defaultOptions;
	const hasEdited = !isEqual(options, defaultOptions);

	const onEdit = (): void => {
		navigation.navigate('WidgetEdit', { id, initialFields: options });
	};

	const onDelete = (): void => {
		dispatch(deleteWidget(id));
		navigation.popToTop();
	};

	const onSave = (): void => {
		dispatch(saveWidget({ id, options }));
		navigation.popToTop();
	};

	const renderWidget = (): ReactElement => {
		switch (id) {
			case 'blocks': {
				const blocksOptions = options as TBlocksWidgetOptions;
				return <BlocksWidget options={blocksOptions} />;
			}
			case 'calculator': {
				return <CalculatorWidget />;
			}
			case 'facts': {
				const factsOptions = options as TFactsWidgetOptions;
				return <FactsWidget options={factsOptions} />;
			}
			case 'news': {
				const newsOptions = options as TNewsWidgetOptions;
				return <NewsWidget options={newsOptions} />;
			}
			case 'price': {
				const priceOptions = options as TPriceWidgetOptions;
				return <PriceWidget options={priceOptions} />;
			}
			case 'weather': {
				const weatherOptions = options as TWeatherWidgetOptions;
				return <WeatherWidget options={weatherOptions} />;
			}
		}
	};

	return (
		<ThemedView style={styles.container}>
			<SafeAreaInset type="top" />
			<NavigationHeader title={t('widget.nav_title')} />

			<KeyboardAvoidingView style={styles.content}>
				<ScrollView contentContainerStyle={styles.scrollContent}>
					<View style={styles.header}>
						<View style={styles.headerText}>
							<Headline numberOfLines={2}>
								{widget.name.split(' ').join('\n')}
							</Headline>
						</View>
						<SvgXml style={styles.headerImage} xml={widget.icon} />
					</View>

					<BodyM style={styles.description} color="secondary">
						{widget.description}
					</BodyM>

					{hasOptions && (
						<TouchableOpacity
							style={styles.item}
							testID="WidgetEdit"
							onPress={onEdit}>
							<View style={styles.columnLeft}>
								<BodyM color="white">{t('widget.edit')}</BodyM>
							</View>
							<View style={styles.columnRight}>
								<BodyM style={styles.valueText} testID="Value">
									{hasEdited
										? t('widget.edit_custom')
										: t('widget.edit_default')}
								</BodyM>
								<ChevronRight color="secondary" width={24} height={24} />
							</View>
						</TouchableOpacity>
					)}

					<View style={styles.footer}>
						<Caption13Up style={styles.caption} color="secondary">
							{t('preview')}
						</Caption13Up>

						{renderWidget()}

						<View style={styles.buttonsContainer}>
							{savedWidget && (
								<Button
									style={styles.button}
									text={t('common:delete')}
									size="large"
									variant="secondary"
									testID="WidgetDelete"
									onPress={onDelete}
								/>
							)}
							<Button
								style={styles.button}
								text={t('save')}
								size="large"
								testID="WidgetSave"
								onPress={onSave}
							/>
						</View>
					</View>
				</ScrollView>
				<SafeAreaInset type="bottom" minPadding={16} />
			</KeyboardAvoidingView>
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		flexGrow: 1,
		paddingHorizontal: 16,
	},
	scrollContent: {
		flexGrow: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	headerText: {
		justifyContent: 'center',
	},
	headerImage: {
		borderRadius: 8,
		overflow: 'hidden',
		height: 64,
		width: 64,
	},
	caption: {
		marginBottom: 16,
	},
	footer: {
		paddingTop: 16,
		marginTop: 'auto',
	},
	// previewLoading: {
	// 	borderRadius: 16,
	// 	justifyContent: 'center',
	// 	alignItems: 'center',
	// 	minHeight: 180,
	// },
	buttonsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: 16,
		gap: 16,
	},
	button: {
		flex: 1,
	},
	description: {
		fontWeight: 'normal',
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
		borderTopWidth: 1,
		borderBottomWidth: 1,
		marginTop: 16,
		minHeight: 56,
	},
	valueText: {
		marginRight: 15,
	},
	columnLeft: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	columnRight: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});

export default Widget;
