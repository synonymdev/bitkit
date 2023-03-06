declare module '*.svg' {
	import React from 'react';
	import { SvgProps } from 'react-native-svg';
	const content: React.FC<SvgProps>;
	export default content;
}

declare module '*.mp4' {
	const src: string;
	export default src;
}

declare module 'styled-components' {
	import { ITheme } from './src/styles/themes';
	export interface DefaultTheme extends ITheme {}
}
