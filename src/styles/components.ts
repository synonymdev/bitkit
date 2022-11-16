import { Platform, Switch as _Switch } from 'react-native';
import styled from 'styled-components/native';
import _Feather from 'react-native-vector-icons/Feather';
import _EvilIcon from 'react-native-vector-icons/EvilIcons';
import _Ionicons from 'react-native-vector-icons/Ionicons';
import _MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import _AntDesign from 'react-native-vector-icons/AntDesign';
import Animated from 'react-native-reanimated';
import colors from './colors';
import { SvgXml } from 'react-native-svg';
import {
	DefaultTheme,
	NavigationContainer as _NavigationContainer,
} from '@react-navigation/native';
import { sanFranciscoWeights } from 'react-native-typography';
import { SafeAreaProvider as _SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetTextInput as _BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { settings, dismiss, boost, profileIcon } from '../assets/icons/header';
import {
	bitcoinIcon,
	lightningIcon,
	bitcoinCircleIcon,
	tetherCircleIcon,
	receivedIcon,
	switchIcon,
	sentIcon,
	transferIcon,
	coinsIcon,
	userPlusIcon,
	userMinusIcon,
	gitBranchIcon,
	noteIcon,
	checkCircleIcon,
	clockIcon,
	timerIcon,
	timerIconAlt,
	magnifyingGlassIcon,
	clipboardTextIcon,
	usersIcon,
	userIcon,
	speedFastIcon,
	speedNormalIcon,
	speedSlowIcon,
	gearIcon,
	xIcon,
	tagIcon,
	shareIcon,
	penIcon,
	pencileIcon,
	infoIcon,
	qrPage,
	scanIcon,
	cameraIcon,
	savingsIcon,
	bIcon,
	unitBitcoinIcon,
	unitSatoshiIcon,
	trashIcon,
	plusIcon,
	backIcon,
	cornersOut,
	pictureIcon,
	flashlightIcon,
	brokenLinkIcon,
	eyeIcon,
	heartbeatIcon,
	chartLineIcon,
	newspaperIcon,
	cubeIcon,
} from '../assets/icons/wallet';
import {
	chevronRightIcon,
	leftArrowIcon,
	rightArrowIcon,
	upArrowIcon,
	downArrowIcon,
	checkmarkIcon,
	copyIcon,
	faceIdIcon,
	touchIdIcon,
	bitkitIcon,
	emailIcon,
	githubIcon,
	globeIcon,
	mediumIcon,
	twitterIcon,
	listIcon,
} from '../assets/icons/settings';
import { bitfinexIcon } from '../assets/icons/widgets';

import { logo } from '../assets/icons/onboarding';
import _SafeAreaView from '../components/SafeAreaView';

export const DismissIcon = styled(SvgXml).attrs((props) => ({
	xml: dismiss(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '16px',
	width: props?.width ?? '14px',
	color: undefined,
}))({});

export const ScanIcon = styled(SvgXml).attrs((props) => ({
	xml: scanIcon(props?.color ? props.theme.colors[props.color] : '#636366'),
	height: props?.height ?? '20.53px',
	width: props?.width ?? '20.54px',
	color: undefined,
}))({});

export const SettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: settings(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const TransferIcon = styled(SvgXml).attrs((props) => ({
	xml: transferIcon(props?.color ? props.theme.colors[props.color] : '#636366'),
	height: props?.height ?? '19.8px',
	width: props?.width ?? '21.6px',
	color: undefined,
}))({});

export const CoinsIcon = styled(SvgXml).attrs((props) => ({
	xml: coinsIcon(props?.color ? props.theme.colors[props.color] : '#F7931A'),
	height: props?.height ?? '12.8',
	width: props?.width ?? '12.8',
	color: undefined,
}))({});

export const UserPlusIcon = styled(SvgXml).attrs((props) => ({
	xml: userPlusIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const UserMinusIcon = styled(SvgXml).attrs((props) => ({
	xml: userMinusIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const GitBranchIcon = styled(SvgXml).attrs((props) => ({
	xml: gitBranchIcon(
		props?.color ? props.theme.colors[props.color] : '#F75C1A',
	),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const NoteIcon = styled(SvgXml).attrs((props) => ({
	xml: noteIcon(props?.color ? props.theme.colors[props.color] : '#F75C1A'),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const CheckCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: checkCircleIcon(
		props?.color ? props.theme.colors[props.color] : 'white',
	),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const ClockIcon = styled(SvgXml).attrs((props) => ({
	xml: clockIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const TimerIcon = styled(SvgXml).attrs((props) => ({
	xml: timerIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const TimerIconAlt = styled(SvgXml).attrs((props) => ({
	xml: timerIconAlt(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '17px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const MagnifyingGlassIcon = styled(SvgXml).attrs((props) => ({
	xml: magnifyingGlassIcon(
		props?.color ? props.theme.colors[props.color] : '#8E8E93',
	),
	height: props?.height ?? '20px',
	width: props?.width ?? '20px',
	color: undefined,
}))({});

export const ClipboardTextIcon = styled(SvgXml).attrs((props) => ({
	xml: clipboardTextIcon(
		props?.color ? props.theme.colors[props.color] : 'white',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const UsersIcon = styled(SvgXml).attrs((props) => ({
	xml: usersIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const UserIcon = styled(SvgXml).attrs((props) => ({
	xml: userIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const SpeedFastIcon = styled(SvgXml).attrs((props) => ({
	xml: speedFastIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const SpeedNormalIcon = styled(SvgXml).attrs((props) => ({
	xml: speedNormalIcon(
		props?.color ? props.theme.colors[props.color] : 'white',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const SpeedSlowIcon = styled(SvgXml).attrs((props) => ({
	xml: speedSlowIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const GearIcon = styled(SvgXml).attrs((props) => ({
	xml: gearIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const XIcon = styled(SvgXml).attrs((props) => ({
	xml: xIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const TagIcon = styled(SvgXml).attrs((props) => ({
	xml: tagIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const ShareIcon = styled(SvgXml).attrs((props) => ({
	xml: shareIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const PenIcon = styled(SvgXml).attrs((props) => ({
	xml: penIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const SavingsIcon = styled(SvgXml).attrs((props) => ({
	xml: savingsIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const BIcon = styled(SvgXml).attrs((props) => ({
	xml: bIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '42px',
	width: props?.width ?? '26px',
	color: undefined,
}))({});

export const BoostIcon = styled(SvgXml).attrs((props) => ({
	xml: boost(),
	width: props?.width ?? '39px',
	color: undefined,
	height: props?.height ?? '39px',
}))({});

export const BitcoinIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinIcon(props?.color ? props.theme.colors[props.color] : '#ED8452'),
	height: props?.height ?? '19.8px',
	width: props?.width ?? '21.6px',
	color: undefined,
}))({});

export const BitcoinCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinCircleIcon(
		props?.color ? props.theme.colors[props.color] : '#F7931A',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const TetherCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: tetherCircleIcon(
		props?.color ? props.theme.colors[props.color] : '#50AF95',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const UnitBitcoinIcon = styled(SvgXml).attrs((props) => ({
	xml: unitBitcoinIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const UnitSatoshiIcon = styled(SvgXml).attrs((props) => ({
	xml: unitSatoshiIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const LightningIcon = styled(SvgXml).attrs((props) => ({
	xml: lightningIcon(
		props?.color ? props.theme.colors[props.color] : '#B95CE8',
	),
	height: props?.height ?? '19.8px',
	width: props?.width ?? '21.6px',
	color: undefined,
}))({});

export const SendIcon = styled(SvgXml).attrs((props) => ({
	xml: sentIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '17px',
	width: props?.width ?? '17px',
	color: undefined,
}))({});

export const ReceiveIcon = styled(SvgXml).attrs((props) => ({
	xml: receivedIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '17px',
	width: props?.width ?? '17px',
	color: undefined,
}))({});

export const ChevronRight = styled(SvgXml).attrs((props) => ({
	xml: chevronRightIcon(
		props?.color ? props.theme.colors[props.color] : 'white',
	),
	height: props?.height ?? '12px',
	width: props?.width ?? '12px',
	color: undefined,
}))({});

export const LeftArrow = styled(SvgXml).attrs((props) => ({
	xml: leftArrowIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.gray2,
	),
	height: props?.height ?? '16.04px',
	width: props?.width ?? '20px',
	color: undefined,
}))({});

export const RightArrow = styled(SvgXml).attrs((props) => ({
	xml: rightArrowIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const UpArrow = styled(SvgXml).attrs((props) => ({
	xml: upArrowIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const DownArrow = styled(SvgXml).attrs((props) => ({
	xml: downArrowIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const Checkmark = styled(SvgXml).attrs((props) => ({
	xml: checkmarkIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.green2,
	),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const CopyIcon = styled(SvgXml).attrs((props) => ({
	xml: copyIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const FaceIdIcon = styled(SvgXml).attrs((props) => ({
	xml: faceIdIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '133px',
	width: props?.width ?? '133px',
	color: undefined,
}))({});

export const TouchIdIcon = styled(SvgXml).attrs((props) => ({
	xml: touchIdIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '133px',
	width: props?.width ?? '133px',
	color: undefined,
}))({});

export const SwitchIcon = styled(SvgXml).attrs((props) => ({
	xml: switchIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '16px',
	width: props?.width ?? '16px',
	color: undefined,
}))({});

export const Logo = styled(SvgXml).attrs((props) => ({
	xml: logo(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props?.height ?? '46px',
	width: props?.width ?? '46px',
	color: undefined,
}))({});

export const ProfileIcon = styled(SvgXml).attrs((props) => ({
	xml: profileIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const ListIcon = styled(SvgXml).attrs((props) => ({
	xml: listIcon(
		props?.color ? props.theme.colors[props.color] : props.theme.colors.gray1,
	),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const Display = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: 'NHaasGroteskDSW02-65Md',
	fontSize: props.size ? props.size : '48px',
	lineHeight: props.lineHeight ?? '49px',
}));

export const Headline = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: 'NHaasGroteskDSW02-65Md',
	fontSize: props.size ? props.size : '34px',
	lineHeight: props.lineHeight ?? '34px',
}));

export const Title = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: 'NHaasGroteskDSW02-65Md',
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
	fontSize: props.size ? props.size : '17px',
}));

export const Text01M = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
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
	lineHeight: '22px',
}));

export const Text01B = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.bold.fontFamily,
	fontSize: props.size ? props.size : '17px',
}));

export const Text02M = styled.Text((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
	fontSize: props.size ? props.size : '15px',
}));

export const Text02B = styled.Text((props) => ({
	...sanFranciscoWeights.bold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '15px',
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
	lineHeight: '20px',
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

export const Caption13M = styled.Text.attrs((props) => props)((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.semibold.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Caption13S = styled.Text((props) => ({
	...sanFranciscoWeights.regular,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.regular.fontFamily,
	fontSize: props.size ? props.size : '13px',
}));

export const Caption13Up = styled.Text((props) => ({
	...sanFranciscoWeights.medium,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontFamily: props.font
		? props.theme.fonts[props.font].fontFamily
		: sanFranciscoWeights.medium.fontFamily,
	fontSize: props.size ? props.size : '13px',
	lineHeight: '18px',
	textTransform: 'uppercase',
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
	textTransform: 'uppercase',
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
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props?.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.gray1,
}))((props) => ({
	...sanFranciscoWeights.semibold,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.color]
		: props.theme.colors.white08,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderRadius: 8,
	fontSize: '15px',
	minHeight: props.minHeight ? props.minHeight : 52,
	padding: 16,
}));

export const TextInputNoOutline = styled.TextInput.attrs((props) => ({
	keyboardAppearance: props.theme.id,
	selectionColor: colors.brand,
	placeholderTextColor: props?.placeholderTextColor
		? props.placeholderTextColor
		: props.theme.colors.gray1,
}))((props) => ({
	...sanFranciscoWeights.semibold,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	fontSize: '15px',
}));

export const BottomSheetTextInput = styled(_BottomSheetTextInput).attrs(
	(props) => ({
		keyboardAppearance: props.theme.id,
		selectionColor: colors.brand,
		placeholderTextColor: props?.placeholderTextColor
			? props.placeholderTextColor
			: props.theme.colors.white5,
	}),
)((props) => ({
	...sanFranciscoWeights.semibold,
	backgroundColor: props.backgroundColor
		? props.theme.colors[props.backgroundColor]
		: props.theme.colors.white04,
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderColor: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
	borderRadius: 8,
	fontSize: '15px',
	minHeight: props.minHeight ? props.minHeight : 70,
	padding: 16,
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

export const Switch = styled(_Switch).attrs((props) => ({
	trackColor: { false: '#767577', true: props.theme.colors.brand },
	thumbColor: 'white',
	ios_backgroundColor: '#3e3e3e',
	...props,
}))({});

export const PencileIcon = styled(SvgXml).attrs((props) => ({
	xml: pencileIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const InfoIcon = styled(SvgXml).attrs((props) => ({
	xml: infoIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const QrPage = styled(SvgXml).attrs((props) => ({
	xml: qrPage(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const CameraIcon = styled(SvgXml).attrs((props) => ({
	xml: cameraIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const TrashIcon = styled(SvgXml).attrs((props) => ({
	xml: trashIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
	color: undefined,
}))({});

export const PlusIcon = styled(SvgXml).attrs((props) => ({
	xml: plusIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
	color: undefined,
}))({});

export const BackIcon = styled(SvgXml).attrs((props) => ({
	xml: backIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const CornersOutIcon = styled(SvgXml).attrs((props) => ({
	xml: cornersOut(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
	color: undefined,
}))({});

export const BitkitIcon = styled(SvgXml).attrs((props) => ({
	xml: bitkitIcon(props?.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props?.height ?? '184px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});

export const EmailIcon = styled(SvgXml).attrs((props) => ({
	xml: emailIcon(props?.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const GithubIcon = styled(SvgXml).attrs((props) => ({
	xml: githubIcon(props?.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const GlobeIcon = styled(SvgXml).attrs((props) => ({
	xml: globeIcon(props?.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const MediumIcon = styled(SvgXml).attrs((props) => ({
	xml: mediumIcon(props?.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props?.height ?? '24px',
	width: props?.width ?? '25px',
	color: undefined,
}))({});

export const TwitterIcon = styled(SvgXml).attrs((props) => ({
	xml: twitterIcon(props?.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const PictureIcon = styled(SvgXml).attrs((props) => ({
	xml: pictureIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const FlashlightIcon = styled(SvgXml).attrs((props) => ({
	xml: flashlightIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const BrokenLinkIcon = styled(SvgXml).attrs((props) => ({
	xml: brokenLinkIcon(
		props?.color ? props.theme.colors[props.color] : '#FF6600',
	),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const EyeIcon = styled(SvgXml).attrs((props) => ({
	xml: eyeIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const HeartbeatIcon = styled(SvgXml).attrs((props) => ({
	xml: heartbeatIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '25px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});

export const BitfinexIcon = styled(SvgXml).attrs((props) => ({
	xml: bitfinexIcon(),
	height: props?.height ?? '32px',
	width: props?.width ?? '32px',
	color: undefined,
}))({});

export const ChartLineIcon = styled(SvgXml).attrs((props) => ({
	xml: chartLineIcon(props.theme.colors[props.color]),
	height: props?.height ?? '64px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});

export const NewspaperIcon = styled(SvgXml).attrs((props) => ({
	xml: newspaperIcon(props.theme.colors[props.color]),
	height: props?.height ?? '64px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});

export const CubeIcon = styled(SvgXml).attrs((props) => ({
	xml: cubeIcon(props.theme.colors[props.color]),
	height: props?.height ?? '64px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});
