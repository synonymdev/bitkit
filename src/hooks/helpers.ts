import { useRef, useEffect } from 'react';

export const usePrevious = <T>(value: T): T | undefined => {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = value;
	}, [value]);

	return ref.current;
};

// https://stackoverflow.com/a/61127960/1231070
export const useDebouncedEffect = (
	effect: Function,
	deps: Array<any>,
	delay: number,
): void => {
	useEffect(() => {
		const handler = setTimeout(() => {
			effect();
		}, delay);

		return (): void => {
			clearTimeout(handler);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [...(deps || []), delay]);
};
