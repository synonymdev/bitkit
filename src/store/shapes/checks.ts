import cloneDeep from 'lodash/cloneDeep';
import { IChecksContent, IChecksShape } from '../types/checks';
import { getNetworkContent } from './wallet';

export const defaultChecksContent: IChecksContent = {
	warnings: getNetworkContent([]),
};

export const getDefaultChecksContent = (): IChecksContent => {
	return cloneDeep(defaultChecksContent);
};

export const defaultChecksShape: Readonly<IChecksShape> = {
	wallet0: getDefaultChecksContent(),
};

export const getDefaultChecksShape = (): IChecksShape => {
	return cloneDeep(defaultChecksShape);
};
