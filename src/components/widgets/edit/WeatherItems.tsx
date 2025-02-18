import { useTranslation } from 'react-i18next';
import useWeatherWidget from '../../../hooks/useWeatherWidget';
import { TWeatherWidgetOptions } from '../../../store/types/widgets';
import { BodyM, Title } from '../../../styles/text';
import { EWidgetItemType, TWidgetItem } from './types';

export const getWeatherItems = (
	options: TWeatherWidgetOptions,
): TWidgetItem[] => {
	const { t } = useTranslation('widgets');
	const { data, status } = useWeatherWidget();

	if (status !== 'ready') {
		return [];
	}

	const { condition, currentFee, nextBlockFee } = data;

	return [
		{
			key: 'showStatus',
			type: EWidgetItemType.toggle,
			title: <Title>{t(`weather.condition.${condition}.title`)}</Title>,
			isChecked: options.showStatus,
		},
		{
			key: 'showText',
			type: EWidgetItemType.toggle,
			title: <BodyM>{t(`weather.condition.${condition}.description`)}</BodyM>,
			isChecked: options.showText,
		},
		{
			key: 'showMedian',
			type: EWidgetItemType.toggle,
			title: t('weather.current_fee'),
			value: currentFee,
			isChecked: options.showMedian,
		},
		{
			key: 'showNextBlockFee',
			type: EWidgetItemType.toggle,
			title: t('weather.next_block'),
			value: `${nextBlockFee} ₿/vByte`,
			isChecked: options.showNextBlockFee,
		},
	];
};
