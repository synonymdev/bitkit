import { ReactElement } from 'react';

export enum EWidgetItemType {
	static = 'static',
	toggle = 'toggle',
	radio = 'radio',
}

export type TWidgetItem = {
	key: string;
	type: EWidgetItemType;
	title: string | ReactElement;
	value?: string | ReactElement;
	isChecked?: boolean;
};
