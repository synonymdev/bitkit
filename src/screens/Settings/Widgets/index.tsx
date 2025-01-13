import React, { memo, ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { EItemType, IListData, ItemData } from '../../../components/List';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
	showWidgetTitlesSelector,
	showWidgetsSelector,
} from '../../../store/reselect/settings';
import { updateSettings } from '../../../store/slices/settings';
import SettingsView from './../SettingsView';

const WidgetSettings = (): ReactElement => {
	const { t } = useTranslation('settings');
	const dispatch = useAppDispatch();
	const showWidgets = useAppSelector(showWidgetsSelector);
	const showWidgetTitles = useAppSelector(showWidgetTitlesSelector);

	const listData: IListData[] = useMemo(() => {
		const data: ItemData[] = [
			{
				title: t('widgets.showWidgets'),
				type: EItemType.switch,
				enabled: showWidgets,
				testID: 'ToggleWidgets',
				onPress: (): void => {
					dispatch(updateSettings({ showWidgets: !showWidgets }));
				},
			},
			{
				title: t('widgets.showWidgetTitles'),
				type: EItemType.switch,
				enabled: showWidgetTitles,
				testID: 'ToggleWidgetTitles',
				onPress: (): void => {
					dispatch(updateSettings({ showWidgetTitles: !showWidgetTitles }));
				},
			},
		];

		return [{ data }];
	}, [showWidgets, showWidgetTitles, dispatch, t]);

	return <SettingsView title={t('widgets.nav_title')} listData={listData} />;
};

export default memo(WidgetSettings);
