import styled from 'styled-components/native';
import _Feather from 'react-native-vector-icons/Feather';
import _EvilIcon from 'react-native-vector-icons/EvilIcons';
import _Ionicons from 'react-native-vector-icons/Ionicons';
import _MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import _AntDesign from 'react-native-vector-icons/AntDesign';
import { SvgXml } from 'react-native-svg';

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
import { bitfinexIcon } from '../assets/icons/widgets';
import { logo } from '../assets/icons/onboarding';

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

export const TimerSpeedIcon = styled(SvgXml).attrs((props) => ({
	xml: timerSpeedIcon(props?.color ? props.theme.colors[props.color] : 'white'),
	height: props?.height ?? '16px',
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

export const LightBulbIcon = styled(SvgXml).attrs((props) => ({
	xml: lightbulbIcon(props.theme.colors[props.color]),
	height: props?.height ?? '64px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});

export const MinusCircledIcon = styled(SvgXml).attrs((props) => ({
	xml: minusCircledIcon(props.theme.colors[props.color]),
	height: props?.height ?? '64px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});

export const PlusCircledIcon = styled(SvgXml).attrs((props) => ({
	xml: plusCircledIcon(props.theme.colors[props.color]),
	height: props?.height ?? '64px',
	width: props?.width ?? '64px',
	color: undefined,
}))({});

export const KeyIcon = styled(SvgXml).attrs((props) => ({
	xml: keyIcon(props.theme.colors[props.color]),
	height: props?.height ?? '24px',
	width: props?.width ?? '24px',
	color: undefined,
}))({});
