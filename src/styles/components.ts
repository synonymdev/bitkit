import { Platform } from 'react-native';
import styled from 'styled-components';
import _Feather from 'react-native-vector-icons/Feather';
import _EvilIcon from 'react-native-vector-icons/EvilIcons';
import _Ionicons from 'react-native-vector-icons/Ionicons';
import _MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import _AntDesign from 'react-native-vector-icons/AntDesign';
import Animated from 'react-native-reanimated';
import colors from './colors';
import _RadioButtonRN from 'radio-buttons-react-native';
import { SvgXml } from 'react-native-svg';
import { camera, settings, dismiss, boost } from '../assets/icons/header';
import {
	bitcoinIcon,
	lightningIcon,
	bitcoinCircleIcon,
	tetherCircleIcon,
	receivedIcon,
	sentIcon,
	transferIcon,
} from '../assets/icons/wallet';
import {
	chevronRightIcon,
	leftArrowIcon,
	checkmarkIcon,
	copyIcon,
} from '../assets/icons/settings';
import { logo } from '../assets/icons/onboarding';
import { sanFranciscoWeights } from 'react-native-typography';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';
import _SafeAreaView from '../components/SafeAreaView';
import {
	DefaultTheme,
	NavigationContainer as _NavigationContainer,
} from '@react-navigation/native';

export const DismissIcon = styled(SvgXml).attrs((props) => ({
	xml: dismiss(props?.color ? props.theme.colors[props.color] : 'white'),
	width: props?.width ?? '14px',
	height: props?.height ?? '16px',
}))({});

export const CameraIcon = styled(SvgXml).attrs((props) => ({
	xml: camera(props?.color ? props.theme.colors[props.color] : '#636366'),
	width: props?.width ?? '20.54px',
	height: props?.height ?? '20.53px',
}))({});

export const SettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: settings(props?.color ? props.theme.colors[props.color] : '#636366'),
	width: props?.width ?? '21.6px',
	height: props?.height ?? '19.8px',
}))({});

export const TransferIcon = styled(SvgXml).attrs((props) => ({
	xml: transferIcon(props?.color ? props.theme.colors[props.color] : '#636366'),
	height: props?.height ?? '19.8px',
	width: props?.width ?? '21.6px',
}))({});

export const BoostIcon = styled(SvgXml).attrs((props) => ({
	xml: boost(),
	width: props?.width ?? '39px',
	height: props?.height ?? '39px',
}))({});

export const BitcoinIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinIcon(props?.color ? props.theme.colors[props.color] : '#ED8452'),
	height: props?.height ?? '19.8px',
	width: props?.width ?? '21.6px',
}))({});

export const BitcoinCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinCircleIcon(
		props?.color ? props.theme.colors[props.color] : '#F7931A',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
}))({});

export const TetherCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: tetherCircleIcon(
		props?.color ? props.theme.colors[props.color] : '#50AF95',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
}))({});

export const LightningIcon = styled(SvgXml).attrs((props) => ({
	xml: lightningIcon(
		props?.color ? props.theme.colors[props.color] : '#B95CE8',
	),
	height: props?.height ?? '19.8px',
	width: props?.width ?? '21.6px',
}))({});

export const SendIcon = styled(SvgXml).attrs((props) => ({
	xml: sentIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '17px',
	width: props?.width ?? '17px',
}))({});

export const ReceiveIcon = styled(SvgXml).attrs((props) => ({
	xml: receivedIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '17px',
	width: props?.width ?? '17px',
}))({});

export const ChevronRight = styled(SvgXml).attrs((props) => ({
	xml: chevronRightIcon(
		props?.color ? props.theme.colors[props.color] : 'white',
	),
	height: props?.height ?? '12px',
	width: props?.width ?? '12px',
}))({});

export const LeftArrow = styled(SvgXml).attrs((props) => ({
	xml: leftArrowIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.gray2,
	),
	height: props?.height ?? '16.04px',
	width: props?.width ?? '20px',
}))({});

export const Checkmark = styled(SvgXml).attrs((props) => ({
	xml: checkmarkIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.green2,
	),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
}))({});

export const Copy = styled(SvgXml).attrs((props) => ({
	xml: copyIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
}))({});

export const Logo = styled(SvgXml).attrs((props) => ({
	xml: logo(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '46px',
	width: props?.width ?? '46px',
}))({});

export const Display = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '48px',
}));

export const Headline = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '34px',
}));

export const Title = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '22px',
}));

export const Subtitle = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.bold.fontFamily,
	fontSize: props.size ? props.size : '18px',
}));

export const Text01M = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '17px',
}));

export const Text01S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '17px',
}));

export const Text02M = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '15px',
}));

export const SubHeadM = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontWeight: 500,
	fontSize: props.size ? props.size : '14px',
}));

export const Text02S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '15px',
}));

export const Caption13M = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Caption13S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color ? props.theme.colors[props.color] : '#636366',
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Caption13Up = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color ? props.theme.colors[props.color] : '#636366',
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Text13S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Text13UP = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const SafeAreaView = styled(_SafeAreaView)`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

export const Container = styled.View((props) => ({
	flex: 1,
	backgroundColor: props.theme.colors.background,
}));

export const View = styled.View((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const AnimatedView = styled(Animated.View)((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const TouchableOpacity = styled.TouchableOpacity((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const Pressable = styled.Pressable((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
	opacity: props.disabled ? 0.4 : 1,
}));

export const ScrollView = styled.ScrollView((props) => ({
	backgroundColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.background,
}));

export const TextInput = styled.TextInput.attrs((props) => ({
	selectionColor: colors.orange,
	placeholderTextColor: props?.placeholderTextColor
		? props.placeholderTextColor
		: 'gray',
}))((props) => ({
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.color]
		: props.theme.colors.onSurface,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}));

export const RefreshControl = styled.RefreshControl.attrs((props) => ({
	tintColor: props.theme.colors.refreshControl,
}))({});

export const StatusBar = styled.StatusBar.attrs((props) => ({
	animated: true,
	barStyle:
		Platform.OS === 'android'
			? 'light-content'
			: props.theme.id === 'light'
			? 'dark-content'
			: 'light-content',
}))({});

export const Text = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontWeight: props.font
		? props.theme.fonts[props.font].fontWeight
		: sanFranciscoWeights.medium.fontWeight,
}));

export const RadioButtonRN = styled(_RadioButtonRN).attrs((props) => ({
	box: props?.box ? props.box : false,
	textStyle: props?.textStyle
		? props.textStyle
		: { color: props.theme.colors.text },
	activeColor: props?.activeColor
		? props.activeColor
		: props.theme.colors.onBackground,
}))({});

export const Feather = styled(_Feather).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))({});

export const MaterialIcons = styled(_MaterialIcons).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))({});

export const AntDesign = styled(_AntDesign).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))({});

export const EvilIcon = styled(_EvilIcon).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))({});

export const Ionicons = styled(_Ionicons).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))({});

export const SafeAreaProvider = styled(_SafeAreaProvider)`
	flex: 1;
	background-color: ${(props): string => props.theme.colors.background};
`;

export const NavigationContainer = styled(_NavigationContainer).attrs(
	(props) => ({
		independent: true,
		theme: {
			...DefaultTheme,
			colors: {
				...DefaultTheme.colors,
				card: 'transparent',
				text: props.theme.colors.text,
				background: 'transparent',
				primary: 'transparent',
				border: 'transparent',
			},
		},
	}),
)({});
