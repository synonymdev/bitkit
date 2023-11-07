import { IWidgetsStore } from '../types/widgets';
import cloneDeep from 'lodash/cloneDeep';

export const defaultWidgetsShape: Readonly<IWidgetsStore> = {
	widgets: {},
	onboardedWidgets: false,
	sortOrder: [],
};

export const getDefaultWidgetsShape = (): IWidgetsStore => {
	return cloneDeep(defaultWidgetsShape);
};
