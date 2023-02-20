import { IWidgetsStore } from '../types/widgets';
import cloneDeep from 'lodash.clonedeep';

export const defaultWidgetsShape: Readonly<IWidgetsStore> = {
	widgets: {},
	onboardedWidgets: false,
	sortOrder: [],
};

export const getDefaultWidgetsShape = (): IWidgetsStore => {
	return cloneDeep(defaultWidgetsShape);
};
