import isEqual from 'lodash/isEqual';
import { useState } from 'react';
import { TWidgetItem } from '../components/widgets/edit/types';
import {
	TPriceWidgetOptions,
	TWidgetId,
	TWidgetOptions,
} from '../store/types/widgets';
import { getDefaultOptions } from '../utils/widgets';

export const useWidgetOptions = (
	id: TWidgetId,
	initialFields: TWidgetOptions,
) => {
	const [options, setOptions] = useState(initialFields);
	const defaultOptions = getDefaultOptions(id);
	const hasEdited = !isEqual(options, defaultOptions);
	const hasEnabledOption = Object.values(options).some(Boolean);

	const toggleOption = ({ key, type }: TWidgetItem): void => {
		if (id === 'price' && type === 'toggle' && key !== 'showSource') {
			const priceOptions = options as TPriceWidgetOptions;

			// Handle pairs array toggle
			// @ts-ignore options type is shared between all widgets
			setOptions((prev) => ({
				...prev,
				pairs: priceOptions.pairs?.includes(key)
					? priceOptions.pairs.filter((pair) => pair !== key)
					: [...(priceOptions.pairs || []), key],
			}));
			return;
		}

		if (type === 'static') {
			return;
		}

		if (type === 'toggle') {
			// @ts-ignore options type is shared between all widgets
			setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
			return;
		}

		if (type === 'radio') {
			// @ts-ignore options type is shared between all widgets
			setOptions((prev) => ({ ...prev, period: key }));
			return;
		}
	};

	const resetOptions = (): void => {
		setOptions(defaultOptions);
	};

	return {
		options,
		hasEdited,
		hasEnabledOption,
		toggleOption,
		resetOptions,
	};
};
