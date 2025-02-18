import React from 'react';
import { useTranslation } from 'react-i18next';
import { tradingPairs } from '../../../constants/widgets';
import usePriceWidget from '../../../hooks/usePriceWidget';
import {
	TGraphPeriod,
	TPriceWidgetOptions,
} from '../../../store/types/widgets';
import { BodySSB } from '../../../styles/text';
import PriceChart from '../../PriceChart';
import { EWidgetItemType, TWidgetItem } from './types';

export const getPriceItems = (options: TPriceWidgetOptions): TWidgetItem[] => {
	const { t } = useTranslation('widgets');
	const allPairs = tradingPairs.map((pair) => pair.name);
	const { data, status } = usePriceWidget(allPairs, '1D');

	const periods: TGraphPeriod[] = ['1D', '1W', '1M', '1Y'];

	if (status !== 'ready') {
		return [];
	}

	const pairItems = tradingPairs.map((pair) => {
		const price = data.find((d) => d.name === pair.name)?.price;
		return {
			key: pair.name,
			type: EWidgetItemType.toggle,
			title: pair.name,
			value: price,
			isChecked: options.pairs.includes(pair.name),
		};
	});

	const periodItems = periods.map((period) => ({
		key: period,
		type: EWidgetItemType.radio,
		title: <PriceChart period={period} />,
		isChecked: options.period === period,
	}));

	return [
		...pairItems,
		...periodItems,
		{
			key: 'showSource',
			type: EWidgetItemType.toggle,
			title: t('widget.source'),
			value: (
				<BodySSB color="secondary" numberOfLines={1} ellipsizeMode="middle">
					Bitfinex.com
				</BodySSB>
			),
			isChecked: options.showSource,
		},
	];
};
