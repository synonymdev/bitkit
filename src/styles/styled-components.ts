import * as styledComponents from 'styled-components/native';
import { ITheme } from './themes';

const {
	default: styled,
	css,
	ThemeProvider,
} = styledComponents as unknown as styledComponents.ReactNativeThemedStyledComponentsModule<ITheme>;

export { css, ThemeProvider };
export default styled;
