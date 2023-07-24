import { Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';

import styled from './styled-components';
import { IThemeColors } from './themes';
import { settings, profileIcon } from '../assets/icons/header';
import { bitfinexIcon } from '../assets/icons/widgets';
import {
	lightningIcon,
	bitcoinCircleIcon,
	receivedIcon,
	switchIcon,
	sentIcon,
	transferIcon,
	coinsIcon,
	userPlusIcon,
	userMinusIcon,
	gitBranchIcon,
	noteIcon,
	calendarIcon,
	checkCircleIcon,
	clockIcon,
	timerIcon,
	timerIconAlt,
	timerSpeedIcon,
	magnifyingGlassIcon,
	clipboardTextIcon,
	usersIcon,
	userIcon,
	userRectangleIcon,
	speedFastIcon,
	speedNormalIcon,
	speedSlowIcon,
	xIcon,
	tagIcon,
	penIcon,
	pencileIcon,
	infoIcon,
	scanIcon,
	cameraIcon,
	savingsIcon,
	bIcon,
	unitBitcoinIcon,
	unitSatoshiIcon,
	unitFiatIcon,
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
	hourglassIcon,
	bitcoinSlantedIcon,
	backspaceIcon,
	exclamationIcon,
	fingerPrintIcon,
	lockIcon,
	shareIosIcon,
	shareAndroidIcon,
	hourglassSimpleIcon,
} from '../assets/icons/wallet';
import {
	chevronRightIcon,
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
	sortAscendingIcon,
	arrowCounterClock,
	leftSign,
	rightSign,
	arrowClockwise,
	rectanglesTwo,
	lightningHollow,
} from '../assets/icons/settings';

type IconProps = {
	color?: keyof IThemeColors;
};

export const ScanIcon = styled(SvgXml).attrs((props) => ({
	xml: scanIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '20.53px',
	width: props.width ?? '20.54px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: settings(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TransferIcon = styled(SvgXml).attrs((props) => ({
	xml: transferIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '19.8px',
	width: props.width ?? '21.6px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CoinsIcon = styled(SvgXml).attrs((props) => ({
	xml: coinsIcon(props.color ? props.theme.colors[props.color] : 'white'),
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
	xml: gitBranchIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const NoteIcon = styled(SvgXml).attrs((props) => ({
	xml: noteIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CalendarIcon = styled(SvgXml).attrs((props) => ({
	xml: calendarIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '14px',
	width: props.width ?? '12px',
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

export const HourglassIcon = styled(SvgXml).attrs((props) => ({
	xml: hourglassIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '14px',
	width: props.width ?? '10px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const HourglassSimpleIcon = styled(SvgXml).attrs((props) => ({
	xml: hourglassSimpleIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
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
		props.color ? props.theme.colors[props.color] : 'white',
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

export const UserRectangleIcon = styled(SvgXml).attrs((props) => ({
	xml: userRectangleIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
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

const ShareIosIcon = styled(SvgXml).attrs((props) => ({
	xml: shareIosIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

const ShareAndroidIcon = styled(SvgXml).attrs((props) => ({
	xml: shareAndroidIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ShareIcon =
	Platform.OS === 'ios' ? ShareIosIcon : ShareAndroidIcon;

export const PenIcon = styled(SvgXml).attrs((props) => ({
	xml: penIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
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

export const BitcoinSlantedIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinSlantedIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '15px',
	width: props.width ?? '12px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BackspaceIcon = styled(SvgXml).attrs((props) => ({
	xml: backspaceIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '31px',
	width: props.width ?? '31px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ExclamationIcon = styled(SvgXml).attrs((props) => ({
	xml: exclamationIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '60px',
	width: props.width ?? '60px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const FingerPrintIcon = styled(SvgXml).attrs((props) => ({
	xml: fingerPrintIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '65px',
	width: props.width ?? '65px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BitcoinCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinCircleIcon(
		props.color ? props.theme.colors[props.color] : 'white',
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

export const UnitFiatIcon = styled(SvgXml).attrs((props) => ({
	xml: unitFiatIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LightningIcon = styled(SvgXml).attrs((props) => ({
	xml: lightningIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LockIcon = styled(SvgXml).attrs((props) => ({
	xml: lockIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
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
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const RightArrow = styled(SvgXml).attrs((props) => ({
	xml: rightArrowIcon(props.color ? props.theme.colors[props.color] : 'white'),
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

export const ArrowCounterClock = styled(SvgXml).attrs((props) => ({
	xml: arrowCounterClock(
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

export const SortAscendingIcon = styled(SvgXml).attrs((props) => ({
	xml: sortAscendingIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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
	xml: bitkitIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '184px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const EmailIcon = styled(SvgXml).attrs((props) => ({
	xml: emailIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GithubIcon = styled(SvgXml).attrs((props) => ({
	xml: githubIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GlobeIcon = styled(SvgXml).attrs((props) => ({
	xml: globeIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const MediumIcon = styled(SvgXml).attrs((props) => ({
	xml: mediumIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '24px',
	width: props.width ?? '25px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TwitterIcon = styled(SvgXml).attrs((props) => ({
	xml: twitterIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
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
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
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
	xml: chartLineIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const NewspaperIcon = styled(SvgXml).attrs((props) => ({
	xml: newspaperIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CubeIcon = styled(SvgXml).attrs((props) => ({
	xml: cubeIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LightBulbIcon = styled(SvgXml).attrs((props) => ({
	xml: lightbulbIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LeftSign = styled(SvgXml).attrs((props) => ({
	xml: leftSign(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '18px',
	width: props.width ?? '11px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const RightSign = styled(SvgXml).attrs((props) => ({
	xml: rightSign(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '18px',
	width: props.width ?? '11px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ArrowClockwise = styled(SvgXml).attrs((props) => ({
	xml: arrowClockwise(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const RectanglesTwo = styled(SvgXml).attrs((props) => ({
	xml: rectanglesTwo(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LightningHollow = styled(SvgXml).attrs((props) => ({
	xml: lightningHollow(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));
