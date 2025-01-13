import { useAppSelector } from '../hooks/redux';
import { themeColorsSelector } from '../store/reselect/settings';
import { IColors } from '../styles/colors';
import { IThemeColors } from '../styles/themes';

export default function useColors(): IColors & IThemeColors {
	return useAppSelector(themeColorsSelector);
}
