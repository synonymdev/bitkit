import { useEffect, useRef } from 'react';

export const usePrevious = <T>(value: T): T | undefined => {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = value;
	}, [value]);

	return ref.current;
};

export const useRenderCount = (): number => {
	const renderCount = useRef(0);
	renderCount.current++;
	return renderCount.current;
};

// https://stackoverflow.com/a/61127960/1231070
export const useDebouncedEffect = (
	effect: () => void,
	deps: Array<any>,
	delay: number,
): void => {
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const handler = setTimeout(effect, delay);

		return (): void => {
			clearTimeout(handler);
		};
	}, [...(deps || []), delay]);
};
