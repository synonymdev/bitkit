import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { reduceValue } from '../utils/helpers';
import { transactionSelector } from '../store/reselect/wallet';

export function useBalance(): number {
	const transaction = useSelector(transactionSelector);
	const balance = useMemo(() => {
		return reduceValue({
			arr: transaction?.inputs ?? [],
			value: 'value',
		});
	}, [transaction?.inputs]);
	if (balance.isOk()) {
		return balance.value;
	}

	return 0;
}
