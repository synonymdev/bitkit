import { useTranslation } from 'react-i18next';
import useBlocksWidget from '../../../hooks/useBlocksWidget';
import { TBlocksWidgetOptions } from '../../../store/types/widgets';
import { BodySSB } from '../../../styles/text';
import { blocksMapping } from '../BlocksWidget';
import { EWidgetItemType, TWidgetItem } from './types';

export const getBlocksItems = (
	options: TBlocksWidgetOptions,
): TWidgetItem[] => {
	const { t } = useTranslation('widgets');
	const { data, status } = useBlocksWidget();

	if (status !== 'ready') {
		return [];
	}

	const items = Object.keys(blocksMapping).map((key) => ({
		key,
		type: EWidgetItemType.toggle,
		title: blocksMapping[key],
		value: data[key],
		isChecked: options[key],
	}));

	return [
		...items,
		{
			key: 'showSource',
			type: EWidgetItemType.toggle,
			title: t('widget.source'),
			value: (
				<BodySSB color="secondary" numberOfLines={1} ellipsizeMode="middle">
					mempool.space
				</BodySSB>
			),
			isChecked: options.showSource,
		},
	];
};
