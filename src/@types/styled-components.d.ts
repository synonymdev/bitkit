import { ITheme } from '../styles/themes';

declare module 'styled-components/native' {
	export interface DefaultTheme extends ITheme {}
}
