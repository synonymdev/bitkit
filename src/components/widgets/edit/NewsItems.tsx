import { useTranslation } from 'react-i18next';
import useNewsWidget from '../../../hooks/useNewsWidget';
import { TNewsWidgetOptions } from '../../../store/types/widgets';
import { BodyM, BodySSB, Title } from '../../../styles/text';
import { EWidgetItemType, TWidgetItem } from './types';

export const getNewsItems = (options: TNewsWidgetOptions): TWidgetItem[] => {
	const { t } = useTranslation('widgets');
	const { data: article, status } = useNewsWidget();

	if (status !== 'ready') {
		return [];
	}

	return [
		{
			key: 'showDate',
			type: EWidgetItemType.toggle,
			title: <BodyM>{article.timeAgo}</BodyM>,
			isChecked: options.showDate,
		},
		{
			key: 'showTitle',
			type: EWidgetItemType.static,
			title: <Title>{article.title}</Title>,
			isChecked: options.showTitle,
		},
		{
			key: 'showSource',
			type: EWidgetItemType.toggle,
			title: t('widget.source'),
			value: (
				<BodySSB color="secondary" numberOfLines={1} ellipsizeMode="middle">
					{article.publisher}
				</BodySSB>
			),
			isChecked: options.showSource,
		},
	];
};
