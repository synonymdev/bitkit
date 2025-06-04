import { Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';

import {
	aboutIcon,
	activityIcon,
	advancedIcon,
	airplaneIcon,
	arrowClockwiseIcon,
	arrowCounterClockIcon,
	arrowLNfundsIcon,
	arrowsClockwiseIcon,
	backIcon,
	backspaceIcon,
	backupIcon,
	bicycleIcon,
	bitcoinCircleIcon,
	bitcoinSlantedIcon,
	broadcastIcon,
	burgerIcon,
	calendarIcon,
	cameraIcon,
	carIcon,
	checkCircleIcon,
	checkmarkIcon,
	chevronRightIcon,
	clipboardTextIcon,
	clockIcon,
	cloudCheckIcon,
	coinsIcon,
	copyIcon,
	cornersOutIcon,
	devSettingsIcon,
	discordIcon,
	downArrowIcon,
	exclamationIcon,
	eyeIcon,
	faceIdIcon,
	fingerPrintIcon,
	flashlightIcon,
	forkKnifeIcon,
	gameControllerIcon,
	generalSettingsIcon,
	giftIcon,
	gitBranchIcon,
	githubIcon,
	globeIcon,
	globeSimpleIcon,
	headphonesIcon,
	heartbeatIcon,
	horseIcon,
	hourglassIcon,
	hourglassSimpleIcon,
	houseIcon,
	leftSignIcon,
	lightningCircleIcon,
	lightningHollowIcon,
	lightningIcon,
	listIcon,
	magnifyingGlassIcon,
	mediumIcon,
	minusCircledIcon,
	noteIcon,
	pedestrianIcon,
	pencilIcon,
	phoneCallIcon,
	pictureIcon,
	plusCircledIcon,
	plusIcon,
	powerIcon,
	printerIcon,
	qrIcon,
	receivedIcon,
	rectanglesTwoIcon,
	rightArrowIcon,
	rightSignIcon,
	scanIcon,
	securityIcon,
	sentIcon,
	settingsIcon,
	shareAndroidIcon,
	shareIosIcon,
	shoppingBagIcon,
	shoppingCartIcon,
	sortAscendingIcon,
	speedFastIcon,
	speedNormalIcon,
	speedSlowIcon,
	stackIcon,
	starIcon,
	storefrontIcon,
	supportIcon,
	tagIcon,
	telegramIcon,
	timerIcon,
	timerIconAltIcon,
	timerSpeedIcon,
	toggleIcon,
	touchIdIcon,
	trainIcon,
	transferIcon,
	trashIcon,
	twitterIcon,
	unifiedCircleIcon,
	unitBitcoinIcon,
	unitFiatIcon,
	upArrowIcon,
	userIcon,
	userMinusIcon,
	userPlusIcon,
	userSquareIcon,
	usersIcon,
	videoCameraIcon,
	warningIcon,
	xIcon,
} from '../assets/icons';
import styled from './styled-components';
import { IThemeColors } from './themes';

type IconProps = {
	color?: keyof IThemeColors;
};

export const AboutIcon = styled(SvgXml).attrs((props) => ({
	xml: aboutIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ActivityIcon = styled(SvgXml).attrs((props) => ({
	xml: activityIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '25px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const AdvancedIcon = styled(SvgXml).attrs((props) => ({
	xml: advancedIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const AirplaneIcon = styled(SvgXml).attrs((props) => ({
	xml: airplaneIcon(),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>(() => ({}));

export const ArrowClockwise = styled(SvgXml).attrs((props) => ({
	xml: arrowClockwiseIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ArrowCounterClock = styled(SvgXml).attrs((props) => ({
	xml: arrowCounterClockIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ArrowLNFunds = styled(SvgXml).attrs((props) => ({
	xml: arrowLNfundsIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '20px',
	width: props.width ?? '45px',
	position: 'absolute',
	right: 15,
	bottom: 0,
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ArrowsClockwiseIcon = styled(SvgXml).attrs((props) => ({
	xml: arrowsClockwiseIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const BackspaceIcon = styled(SvgXml).attrs((props) => ({
	xml: backspaceIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '31px',
	width: props.width ?? '31px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BackupIcon = styled(SvgXml).attrs((props) => ({
	xml: backupIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BicycleIcon = styled(SvgXml).attrs((props) => ({
	xml: bicycleIcon(),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>(() => ({}));

export const BitcoinCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: bitcoinCircleIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color
		? props.theme.colors[props.color]
		: props.theme.colors.brand,
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

export const BroadcastIcon = styled(SvgXml).attrs((props) => ({
	xml: broadcastIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const BurgerIcon = styled(SvgXml).attrs((props) => ({
	xml: burgerIcon(),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>(() => ({}));

export const CalendarIcon = styled(SvgXml).attrs((props) => ({
	xml: calendarIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '14px',
	width: props.width ?? '12px',
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

export const CarIcon = styled(SvgXml).attrs((props) => ({
	xml: carIcon(),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>(() => ({}));

export const CheckCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: checkCircleIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
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

export const Checkmark = styled(SvgXml).attrs((props) => ({
	xml: checkmarkIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
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

export const ClockIcon = styled(SvgXml).attrs((props) => ({
	xml: clockIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CloudCheckIcon = styled(SvgXml).attrs((props) => ({
	xml: cloudCheckIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const CoinsIcon = styled(SvgXml).attrs((props) => ({
	xml: coinsIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const CornersOutIcon = styled(SvgXml).attrs((props) => ({
	xml: cornersOutIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const DevSettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: devSettingsIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const DiscordIcon = styled(SvgXml).attrs((props) => ({
	xml: discordIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
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

export const EyeIcon = styled(SvgXml).attrs((props) => ({
	xml: eyeIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const FlashlightIcon = styled(SvgXml).attrs((props) => ({
	xml: flashlightIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ForkKnifeIcon = styled(SvgXml).attrs((props) => ({
	xml: forkKnifeIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GameControllerIcon = styled(SvgXml).attrs((props) => ({
	xml: gameControllerIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GeneralSettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: generalSettingsIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const GiftIcon = styled(SvgXml).attrs((props) => ({
	xml: giftIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const GlobeSimpleIcon = styled(SvgXml).attrs((props) => ({
	xml: globeSimpleIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const HeadphonesIcon = styled(SvgXml).attrs((props) => ({
	xml: headphonesIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const HeartbeatIcon = styled(SvgXml).attrs((props) => ({
	xml: heartbeatIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '17px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const HorseIcon = styled(SvgXml).attrs((props) => ({
	xml: horseIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const HouseIcon = styled(SvgXml).attrs((props) => ({
	xml: houseIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LeftSign = styled(SvgXml).attrs((props) => ({
	xml: leftSignIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '18px',
	width: props.width ?? '11px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const LightningCircleIcon = styled(SvgXml).attrs((props) => ({
	xml: lightningCircleIcon(),
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

export const LightningHollowIcon = styled(SvgXml).attrs((props) => ({
	xml: lightningHollowIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ListIcon = styled(SvgXml).attrs((props) => ({
	xml: listIcon(
		props.color
			? props.theme.colors[props.color]
			: props.theme.colors.secondary,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const MediumIcon = styled(SvgXml).attrs((props) => ({
	xml: mediumIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '24px',
	width: props.width ?? '25px',
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

export const NoteIcon = styled(SvgXml).attrs((props) => ({
	xml: noteIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PedestrianIcon = styled(SvgXml).attrs((props) => ({
	xml: pedestrianIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PencilIcon = styled(SvgXml).attrs((props) => ({
	xml: pencilIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PhoneCallIcon = styled(SvgXml).attrs((props) => ({
	xml: phoneCallIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
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

export const PlusCircledIcon = styled(SvgXml).attrs((props) => ({
	xml: plusCircledIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
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

export const PowerIcon = styled(SvgXml).attrs((props) => ({
	xml: powerIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const PrinterIcon = styled(SvgXml).attrs((props) => ({
	xml: printerIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const QrIcon = styled(SvgXml).attrs((props) => ({
	xml: qrIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '64px',
	width: props.width ?? '64px',
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

export const RectanglesTwoIcon = styled(SvgXml).attrs((props) => ({
	xml: rectanglesTwoIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const RightSign = styled(SvgXml).attrs((props) => ({
	xml: rightSignIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.white,
	),
	height: props.height ?? '18px',
	width: props.width ?? '11px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ScanIcon = styled(SvgXml).attrs((props) => ({
	xml: scanIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SettingsIcon = styled(SvgXml).attrs((props) => ({
	xml: settingsIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ShareAndroidIcon = styled(SvgXml).attrs((props) => ({
	xml: shareAndroidIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
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

export const ShareIcon =
	Platform.OS === 'ios' ? ShareIosIcon : ShareAndroidIcon;

export const ShoppingBagIcon = styled(SvgXml).attrs((props) => ({
	xml: shoppingBagIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const ShoppingCartIcon = styled(SvgXml).attrs((props) => ({
	xml: shoppingCartIcon(
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

export const SecurityIcon = styled(SvgXml).attrs((props) => ({
	xml: securityIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
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

export const SortAscendingIcon = styled(SvgXml).attrs((props) => ({
	xml: sortAscendingIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const StackIcon = styled(SvgXml).attrs((props) => ({
	xml: stackIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const StarIcon = styled(SvgXml).attrs((props) => ({
	xml: starIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const StorefrontIcon = styled(SvgXml).attrs((props) => ({
	xml: storefrontIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SupportIcon = styled(SvgXml).attrs((props) => ({
	xml: supportIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '33px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const SwitchIcon = styled(SvgXml).attrs((props) => ({
	xml: toggleIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '16px',
	width: props.width ?? '16px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UnifiedIcon = styled(SvgXml).attrs((props) => ({
	xml: unifiedCircleIcon(),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>(() => ({}));

export const UnitBitcoinIcon = styled(SvgXml).attrs((props) => ({
	xml: unitBitcoinIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const UnitFiatIcon = styled(SvgXml).attrs((props) => ({
	xml: unitFiatIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
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

export const UserIcon = styled(SvgXml).attrs((props) => ({
	xml: userIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
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

export const UserSquareIcon = styled(SvgXml).attrs((props) => ({
	xml: userSquareIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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

export const TagIcon = styled(SvgXml).attrs((props) => ({
	xml: tagIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TelegramIcon = styled(SvgXml).attrs((props) => ({
	xml: telegramIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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
	xml: timerIconAltIcon(
		props.color ? props.theme.colors[props.color] : 'white',
	),
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

export const TouchIdIcon = styled(SvgXml).attrs((props) => ({
	xml: touchIdIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '133px',
	width: props.width ?? '133px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TrainIcon = styled(SvgXml).attrs((props) => ({
	xml: trainIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const TransferIcon = styled(SvgXml).attrs((props) => ({
	xml: transferIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '17px',
	width: props.width ?? '16px',
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

export const TwitterIcon = styled(SvgXml).attrs((props) => ({
	xml: twitterIcon(
		props.color ? props.theme.colors[props.color] : props.theme.colors.brand,
	),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const VideoCameraIcon = styled(SvgXml).attrs((props) => ({
	xml: videoCameraIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '32px',
	width: props.width ?? '32px',
}))<IconProps>((props) => ({
	color: props.color ? props.theme.colors[props.color] : 'white',
}));

export const WarningIcon = styled(SvgXml).attrs((props) => ({
	xml: warningIcon(props.color ? props.theme.colors[props.color] : 'white'),
	height: props.height ?? '24px',
	width: props.width ?? '24px',
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
