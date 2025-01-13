import baseStyled from 'styled-components/native';

import { TTheme } from '../store/types/settings';
import colors, { IColors } from './colors';

export interface IDefaultColors extends IColors {
	accent: string;
	success: string;
	error: string;
	transparent: string;
}

export interface IThemeColors extends IDefaultColors {
	primary: string;
	secondary: string;
	background: string;
	surface: string;
	onBackground: string;
	onSurface: string;
	refreshControl: string;
}

interface IFont {
	fontFamily?: string;
}

interface IFonts {
	regular: IFont;
	medium: IFont;
	semiBold: IFont;
	bold: IFont;
	extraBold: IFont;
	black: IFont;
}

interface IDefaultThemeValues {
	colors: IDefaultColors;
	fonts: IFonts;
}

export interface ITheme extends IDefaultThemeValues {
	id: TTheme;
	colors: IThemeColors;
}

const defaultThemeValues: IDefaultThemeValues = {
	colors: {
		...colors,
		accent: '#0000007F',
		success: '#A2BC91',
		error: '#D87682',
		transparent: 'transparent',
	},
	fonts: {
		regular: { fontFamily: 'InterTight-Regular' },
		medium: { fontFamily: 'InterTight-Medium' },
		semiBold: { fontFamily: 'InterTight-SemiBold' },
		bold: { fontFamily: 'InterTight-Bold' },
		extraBold: { fontFamily: 'InterTight-ExtraBold' },
		black: { fontFamily: 'InterTight-Black' },
	},
};

const light: ITheme = {
	...defaultThemeValues,
	id: 'light',
	colors: {
		...defaultThemeValues.colors,
		primary: '#121212',
		secondary: '#121212',
		background: colors.white80,
		surface: '#E8E8E8',
		onBackground: '#121212',
		onSurface: '#D6D6D6',
		refreshControl: '#121212',
	},
};

const dark: ITheme = {
	...defaultThemeValues,
	id: 'dark',
	colors: {
		...defaultThemeValues.colors,
		primary: colors.white,
		secondary: colors.white64,
		background: colors.black,
		surface: '#101010',
		onBackground: '#FFFFFF',
		onSurface: colors.gray6,
		refreshControl: '#FFFFFF',
	},
};

export const getTheme = (theme: string): ITheme => {
	return theme === 'dark' ? dark : light;
};

export default { light, dark };
export const styled = baseStyled;
