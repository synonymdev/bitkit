import _Feather from 'react-native-vector-icons/Feather';
import _EvilIcon from 'react-native-vector-icons/EvilIcons';
import _Ionicons from 'react-native-vector-icons/Ionicons';
import _MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import _AntDesign from 'react-native-vector-icons/AntDesign';
import { SvgXml } from 'react-native-svg';

import styled from './styled-components';
import { IThemeColors } from './themes';
import { settings, dismiss, boost, profileIcon } from '../assets/icons/header';
import { bitfinexIcon } from '../assets/icons/widgets';
import { logo } from '../assets/icons/onboarding';
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
	timerSpeedIcon,
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
	lightbulbIcon,
	minusCircledIcon,
	plusCircledIcon,
	keyIcon,
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

type IconProps = {
	color?: keyof IThemeColors;
};

export const DismissIcon = styled(SvgXml).attrs((props) => ({
	xml: dismiss(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '14px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ScanIcon = styled(SvgXml).attrs((props) => ({
	xml: scanIcon(props.color ? props.theme.colors[props.color] : '#636366'),
	height: props.height ?? '20.53px',
	width: props.width ?? '20.54px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : '#636366',
}));

export const SettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: settings(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TransferIcon = styled(SvgXml).attrs((props) => ({
	xml: transferIcon(props.color ? props.theme.colors[props.color] : '#636366'),
	height: props.height ?? '19.8px',
	width: props.width ?? '21.6px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CoinsIcon = styled(SvgXml).attrs((props) => ({
	xml: coinsIcon(props.color ? props.theme.colors[props.color] : '#F7931A'),
	height: props.height ?? '12.8',
	width: props.width ?? '12.8',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UserPlusIcon = styled(SvgXml).attrs((props) => ({
	xml: userPlusIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UserMinusIcon = styled(SvgXml).attrs((props) => ({
	xml: userMinusIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GitBranchIcon = styled(SvgXml).attrs((props) => ({
	xml: gitBranchIcon(props.color ? props.theme.colors[props.color] : '#F75C1A'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const NoteIcon = styled(SvgXml).attrs((props) => ({
	xml: noteIcon(props.color ? props.theme.colors[props.color] : '#F75C1A'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CheckCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: checkCircleIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ClockIcon = styled(SvgXml).attrs((props) => ({
	xml: clockIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TimerIcon = styled(SvgXml).attrs((props) => ({
	xml: timerIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TimerIconAlt = styled(SvgXml).attrs((props) => ({
	xml: timerIconAlt(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '17px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TimerSpeedIcon = styled(SvgXml).attrs((props) => ({
	xml: timerSpeedIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const MagnifyingGlassIcon = styled(SvgXml).attrs((props) => ({
	xml: magnifyingGlassIcon(
		props.color ? props.theme.colors[props.color] : '#8E8E93',
	),
	height: props.height ?? '20px',
	width: props.width ?? '20px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ClipboardTextIcon = styled(SvgXml).attrs((props) => ({
	xml: clipboardTextIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UsersIcon = styled(SvgXml).attrs((props) => ({
	xml: usersIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UserIcon = styled(SvgXml).attrs((props) => ({
	xml: userIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SpeedFastIcon = styled(SvgXml).attrs((props) => ({
	xml: speedFastIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SpeedNormalIcon = styled(SvgXml).attrs((props) => ({
	xml: speedNormalIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SpeedSlowIcon = styled(SvgXml).attrs((props) => ({
	xml: speedSlowIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GearIcon = styled(SvgXml).attrs((props) => ({
	xml: gearIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const XIcon = styled(SvgXml).attrs((props) => ({
	xml: xIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TagIcon = styled(SvgXml).attrs((props) => ({
	xml: tagIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ShareIcon = styled(SvgXml).attrs((props) => ({
	xml: shareIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PenIcon = styled(SvgXml).attrs((props) => ({
	xml: penIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SavingsIcon = styled(SvgXml).attrs((props) => ({
	xml: savingsIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BIcon = styled(SvgXml).attrs((props) => ({
	xml: bIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '42px',
	width: props.width ?? '26px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BoostIcon = styled(SvgXml).attrs((props) => ({
	xml: boost(),
	width: props.width ?? '39px',
	height: props.height ?? '39px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BitcoinIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinIcon(props.color ? props.theme.colors[props.color] : '#ED8452'),
	height: props.height ?? '19.8px',
	width: props.width ?? '21.6px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BitcoinCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinCircleIcon(
		props.color ? props.theme.colors[props.color] : '#F7931A',
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TetherCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: tetherCircleIcon(
		props.color ? props.theme.colors[props.color] : '#50AF95',
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UnitBitcoinIcon = styled(SvgXml).attrs((props) => ({
	xml: unitBitcoinIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UnitSatoshiIcon = styled(SvgXml).attrs((props) => ({
	xml: unitSatoshiIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LightningIcon = styled(SvgXml).attrs((props) => ({
	xml: lightningIcon(props.color ? props.theme.colors[props.color] : '#B95CE8'),
	height: props.height ?? '19.8px',
	width: props.width ?? '21.6px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SendIcon = styled(SvgXml).attrs((props) => ({
	xml: sentIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '17px',
	width: props.width ?? '17px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ReceiveIcon = styled(SvgXml).attrs((props) => ({
	xml: receivedIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '17px',
	width: props.width ?? '17px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ChevronRight = styled(SvgXml).attrs((props) => ({
	xml: chevronRightIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '12px',
	width: props.width ?? '12px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LeftArrow = styled(SvgXml).attrs((props) => ({
	xml: leftArrowIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.gray2,
	),
	height: props.height ?? '16.04px',
	width: props.width ?? '20px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const RightArrow = styled(SvgXml).attrs((props) => ({
	xml: rightArrowIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UpArrow = styled(SvgXml).attrs((props) => ({
	xml: upArrowIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const DownArrow = styled(SvgXml).attrs((props) => ({
	xml: downArrowIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const Checkmark = styled(SvgXml).attrs((props) => ({
	xml: checkmarkIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.green2,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CopyIcon = styled(SvgXml).attrs((props) => ({
	xml: copyIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const FaceIdIcon = styled(SvgXml).attrs((props) => ({
	xml: faceIdIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '133px',
	width: props.width ?? '133px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TouchIdIcon = styled(SvgXml).attrs((props) => ({
	xml: touchIdIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '133px',
	width: props.width ?? '133px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SwitchIcon = styled(SvgXml).attrs((props) => ({
	xml: switchIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const Logo = styled(SvgXml).attrs((props) => ({
	xml: logo(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '46px',
	width: props.width ?? '46px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ProfileIcon = styled(SvgXml).attrs((props) => ({
	xml: profileIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ListIcon = styled(SvgXml).attrs((props) => ({
	xml: listIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.gray1,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const Feather = styled(_Feather).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const MaterialIcons = styled(_MaterialIcons).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const AntDesign = styled(_AntDesign).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const EvilIcon = styled(_EvilIcon).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const Ionicons = styled(_Ionicons).attrs((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.text,
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PencileIcon = styled(SvgXml).attrs((props) => ({
	xml: pencileIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const InfoIcon = styled(SvgXml).attrs((props) => ({
	xml: infoIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const QrPage = styled(SvgXml).attrs((props) => ({
	xml: qrPage(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CameraIcon = styled(SvgXml).attrs((props) => ({
	xml: cameraIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TrashIcon = styled(SvgXml).attrs((props) => ({
	xml: trashIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PlusIcon = styled(SvgXml).attrs((props) => ({
	xml: plusIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BackIcon = styled(SvgXml).attrs((props) => ({
	xml: backIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CornersOutIcon = styled(SvgXml).attrs((props) => ({
	xml: cornersOut(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BitkitIcon = styled(SvgXml).attrs((props) => ({
	xml: bitkitIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '184px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const EmailIcon = styled(SvgXml).attrs((props) => ({
	xml: emailIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GithubIcon = styled(SvgXml).attrs((props) => ({
	xml: githubIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GlobeIcon = styled(SvgXml).attrs((props) => ({
	xml: globeIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const MediumIcon = styled(SvgXml).attrs((props) => ({
	xml: mediumIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '24px',
	width: props.width ?? '25px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TwitterIcon = styled(SvgXml).attrs((props) => ({
	xml: twitterIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PictureIcon = styled(SvgXml).attrs((props) => ({
	xml: pictureIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const FlashlightIcon = styled(SvgXml).attrs((props) => ({
	xml: flashlightIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BrokenLinkIcon = styled(SvgXml).attrs((props) => ({
	xml: brokenLinkIcon(
		props.color ? props.theme.colors[props.color] : '#FF6600',
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const EyeIcon = styled(SvgXml).attrs((props) => ({
	xml: eyeIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const HeartbeatIcon = styled(SvgXml).attrs((props) => ({
	xml: heartbeatIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '25px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BitfinexIcon = styled(SvgXml).attrs((props) => ({
	xml: bitfinexIcon(),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const MinusCircledIcon = styled(SvgXml).attrs((props) => ({
	xml: minusCircledIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PlusCircledIcon = styled(SvgXml).attrs((props) => ({
	xml: plusCircledIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const KeyIcon = styled(SvgXml).attrs((props) => ({
	xml: keyIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

// Widget icons
export const ChartLineIcon = styled(SvgXml).attrs((props) => ({
	xml: chartLineIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : '#FF6600',
}));

export const NewspaperIcon = styled(SvgXml).attrs((props) => ({
	xml: newspaperIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : '#FF6600',
}));

export const CubeIcon = styled(SvgXml).attrs((props) => ({
	xml: cubeIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : '#FF6600',
}));

export const LightBulbIcon = styled(SvgXml).attrs((props) => ({
	xml: lightbulbIcon(props.color ? props.theme.colors[props.color] : '#FF6600'),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : '#FF6600',
}));
