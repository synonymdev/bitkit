import memoize from 'lodash/memoize';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

enum BREAKPOINTS {
	// xsphone = 320,
	smphone = 360, // small android phone: 360
	// mdphone = 375, // iphoneSE and up
	// lgphone = 390, // iphone15 and up
	// xlphone = 400,
}

/**
 * Check if the screen is at least the specified breakpoint
 **/
const up = (min: keyof typeof BREAKPOINTS): boolean => {
	return width > BREAKPOINTS[min];
};

/**
 * Check if the screen is at most the specified breakpoint
 **/
const down = (max: keyof typeof BREAKPOINTS): boolean => {
	return width <= BREAKPOINTS[max];
};

const breakpoints = {
	up: memoize(up),
	down: memoize(down),
};

type TBreakpoints = typeof breakpoints;

const useBreakpoints = (): TBreakpoints => {
	return breakpoints;
};

export default useBreakpoints;
