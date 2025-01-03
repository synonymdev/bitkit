import React, {
	memo,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BodyM, CaptionB, Text13UP, Title } from '../../styles/text';
import BottomSheetWrapper from '../../components/BottomSheetWrapper';
import SafeAreaInset from '../../components/SafeAreaInset';
import Button from '../../components/buttons/Button';
import BottomSheetNavigationHeader from '../../components/BottomSheetNavigationHeader';
import { useAppSelector } from '../../hooks/redux';
import {
	useBottomSheetBackPress,
	useSnapPoints,
} from '../../hooks/bottomSheet';
import { viewControllerSelector } from '../../store/reselect/ui.ts';
import { auth, parseAuthUrl } from '@synonymdev/react-native-pubky';
import { getPubkySecretKey } from '../../utils/pubky';
import { showToast } from '../../utils/notifications.ts';
import { dispatch } from '../../store/helpers.ts';
import { closeSheet } from '../../store/slices/ui.ts';
import { CheckCircleIcon } from '../../styles/icons.ts';
import Animated, { FadeIn } from 'react-native-reanimated';

const defaultParsedUrl: PubkyAuthDetails = {
	relay: '',
	capabilities: [
		{
			path: '',
			permission: '',
		},
	],
	secret: '',
};

type Capability = {
	path: string;
	permission: string;
};

type PubkyAuthDetails = {
	relay: string;
	capabilities: Capability[];
	secret: string;
};

const Permission = memo(
	({
		capability,
		authSuccess,
	}: {
		capability: Capability;
		authSuccess: boolean;
	}): ReactElement => {
		return (
			<View style={styles.row}>
				<View style={styles.path}>
					<CaptionB color={authSuccess ? 'green' : 'red'}>
						{capability.path}
					</CaptionB>
				</View>
				<View style={styles.permissionsRow}>
					<View style={styles.permission}>
						{capability.permission.includes('r') && (
							<CaptionB color={authSuccess ? 'green' : 'red'}>Read</CaptionB>
						)}
					</View>
					<View style={styles.permission}>
						{capability.permission.includes('w') && (
							<CaptionB color={authSuccess ? 'green' : 'red'}>Write</CaptionB>
						)}
					</View>
				</View>
			</View>
		);
	},
);

const PubkyAuth = (): ReactElement => {
	const { t } = useTranslation('security');
	const snapPoints = useSnapPoints('medium');
	const { url = '' } = useAppSelector((state) => {
		return viewControllerSelector(state, 'pubkyAuth');
	});
	const [parsed, setParsed] =
		React.useState<PubkyAuthDetails>(defaultParsedUrl);
	const [authorizing, setAuthorizing] = React.useState(false);
	const [authSuccess, setAuthSuccess] = React.useState(false);

	useBottomSheetBackPress('pubkyAuth');

	useEffect(() => {
		const fetchParsed = async (): Promise<void> => {
			const res = await parseAuthUrl(url);
			if (res.isErr()) {
				console.log(res.error.message);
				return;
			}
			setParsed(res.value);
		};
		fetchParsed().then();

		return (): void => {
			setParsed(defaultParsedUrl);
			setAuthorizing(false);
			setAuthSuccess(false);
		};
	}, [url]);

	const onAuthorize = useMemo(
		() => async (): Promise<void> => {
			try {
				setAuthorizing(true);
				const secretKey = await getPubkySecretKey();
				if (secretKey.isErr()) {
					showToast({
						type: 'error',
						title: t('authorization.pubky_secret_error_title'),
						description: t('authorization.pubky_secret_error_description'),
					});
					setAuthorizing(false);
					return;
				}
				const authRes = await auth(url, secretKey.value);
				if (authRes.isErr()) {
					showToast({
						type: 'error',
						title: t('authorization.pubky_auth_error_title'),
						description: t('authorization.pubky_auth_error_description'),
					});
					setAuthorizing(false);
					return;
				}
				setAuthSuccess(true);
				setAuthorizing(false);
			} catch (e) {
				showToast({
					type: 'error',
					title: t('authorization.pubky_auth_error_title'),
					description: JSON.stringify(e),
				});
				setAuthorizing(false);
			}
		},
		[t, url],
	);

	const onClose = useMemo(
		() => (): void => {
			dispatch(closeSheet('pubkyAuth'));
		},
		[],
	);

	const Buttons = useCallback(() => {
		if (authSuccess) {
			return (
				<Button
					style={styles.authorizeButton}
					text={t('authorization.success')}
					size="large"
					onPress={onClose}
				/>
			);
		}
		return (
			<>
				<Button
					style={styles.closeButton}
					text={t('authorization.deny')}
					size="large"
					onPress={onClose}
				/>
				<Button
					loading={authorizing}
					style={styles.authorizeButton}
					text={
						authorizing
							? t('authorization.authorizing')
							: t('authorization.authorize')
					}
					size="large"
					onPress={onAuthorize}
				/>
			</>
		);
	}, [authSuccess, authorizing, onAuthorize, onClose, t]);

	const SuccessCircle = useCallback(() => {
		if (authSuccess) {
			return (
				<Animated.View style={styles.circleIcon} entering={FadeIn}>
					<CheckCircleIcon color="green" height={60} width={60} />
				</Animated.View>
			);
		}
		return null;
	}, [authSuccess]);

	return (
		<BottomSheetWrapper view="pubkyAuth" snapPoints={snapPoints}>
			<View style={styles.container}>
				<BottomSheetNavigationHeader title={t('authorization.title')} />
				<Text13UP color="secondary">{t('authorization.claims')}</Text13UP>
				<Title color="white">{parsed.relay}</Title>

				<View style={styles.buffer} />

				<BodyM color="secondary">{t('authorization.description')}</BodyM>

				<View style={styles.buffer} />

				<Text13UP color="secondary">
					{t('authorization.requested_permissions')}
				</Text13UP>
				{parsed.capabilities.map((capability) => {
					return (
						<Permission capability={capability} authSuccess={authSuccess} />
					);
				})}

				<View style={styles.buffer} />

				{SuccessCircle()}

				<View style={styles.buttonContainer}>{Buttons()}</View>
				<SafeAreaInset type="bottom" minPadding={16} />
			</View>
		</BottomSheetWrapper>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		marginHorizontal: 32,
	},
	path: {
		flex: 3,
	},
	buttonContainer: {
		marginTop: 'auto',
		flexDirection: 'row',
		justifyContent: 'center',
	},
	authorizeButton: {
		flex: 1,
		margin: 5,
	},
	closeButton: {
		flex: 1,
		margin: 5,
		backgroundColor: 'black',
		borderWidth: 1,
	},
	buffer: {
		height: 16,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	permission: {
		flex: 1,
	},
	permissionsRow: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
	circleIcon: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default memo(PubkyAuth);
