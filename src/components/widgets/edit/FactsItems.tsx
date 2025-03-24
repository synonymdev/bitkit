import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TFactsWidgetOptions } from '../../../store/types/widgets';
import { BodySSB, Title } from '../../../styles/text';
import { getRandomFact } from '../../../utils/widgets';
import { EWidgetItemType, TWidgetItem } from './types';

export const getFactsItems = (options: TFactsWidgetOptions): TWidgetItem[] => {
	const { t } = useTranslation('widgets');
	const fact = useMemo(() => getRandomFact(), []);

	return [
		{
			key: 'showTitle',
			type: EWidgetItemType.static,
			title: <Title>{fact}</Title>,
			isChecked: true,
		},
		{
			key: 'showSource',
			type: EWidgetItemType.toggle,
			title: t('widget.source'),
			value: (
				<BodySSB color="secondary" numberOfLines={1} ellipsizeMode="middle">
					synonym.to
				</BodySSB>
			),
			isChecked: options.showSource,
		},
	];
};
