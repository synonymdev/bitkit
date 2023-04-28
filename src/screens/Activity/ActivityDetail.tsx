import React, {
	ReactElement,
	memo,
	useCallback,
	useEffect,
	useMemo,
	useState,
	ReactNode,
} from 'react';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	View,
	TouchableOpacity,
} from 'react-native';
import {
	Canvas,
	Path,
	RadialGradient,
	Rect,
	Skia,
	vec,
} from '@shopify/react-native-skia';
import { useSelector } from 'react-redux';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';

import { View as ThemedView } from '../../styles/components';
import { Caption13M, Caption13Up, Text02M, Title } from '../../styles/text';
import {
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	GitBranchIcon,
	HourglassIcon,
	LightningIcon,
	ReceiveIcon,
	SendIcon,
	SpeedFastIcon,
	TagIcon,
	TimerIcon,
	TimerIconAlt,
	UserMinusIcon,
	UserPlusIcon,
} from '../../styles/icons';
import Button from '../../components/Button';
import Money from '../../components/Money';
import ContactSmall from '../../components/ContactSmall';
import NavigationHeader from '../../components/NavigationHeader';
import {
	EActivityType,
	TLightningActivityItem,
	TOnchainActivityItem,
} from '../../store/types/activity';
import {
	canBoost,
	getBlockExplorerLink,
} from '../../utils/wallet/transactions';
import SafeAreaView from '../../components/SafeAreaView';
import SafeAreaInsets from '../../components/SafeAreaInsets';
import Tag from '../../components/Tag';
import useColors from '../../hooks/colors';
import { useAppSelector } from '../../hooks/redux';
import useDisplayValues from '../../hooks/displayValues';
import Store from '../../store/types';
import { showBottomSheet } from '../../store/actions/ui';
import {
	EPaymentType,
	EBoostType,
	EBalanceUnit,
} from '../../store/types/wallet';
import {
	activityItemSelector,
	activityItemsSelector,
} from '../../store/reselect/activity';
import {
	deleteMetaTxTag,
	deleteMetaSlashTagsUrlTag,
} from '../../store/actions/metadata';
import { getTransactions } from '../../utils/wallet/electrum';
import { ITransaction, ITxHash } from '../../utils/wallet';
import { btcToSats, openURL } from '../../utils/helpers';
import { getBoostedTransactionParents } from '../../utils/boost';
import {
	showErrorNotification,
	showInfoNotification,
} from '../../utils/notifications';
import ActivityTagsPrompt from './ActivityTagsPrompt';
import {
	boostedTransactionsSelector,
	selectedNetworkSelector,
} from '../../store/reselect/wallet';
import {
	slashTagsUrlSelector,
	tagSelector,
} from '../../store/reselect/metadata';
import type {
	RootNavigationProp,
	RootStackScreenProps,
} from '../../navigation/types';

const Section = memo(
	({ title, value }: { title: string; value: ReactNode }) => {
		const { white1 } = useColors();

		return (
			<View style={[styles.sRoot, { borderBottomColor: white1 }]}>
				<View style={styles.sText}>
					<Caption13Up color="gray1">{title}</Caption13Up>
				</View>
				<View style={styles.sText}>{value}</View>
			</View>
		);
	},
);

const Glow = ({
	color,
	size,
}: {
	color: string;
	size: { width: number; height: number };
}): ReactElement => {
	return (
		<Rect x={0} y={0} width={size.width} height={size.height} opacity={0.3}>
			<RadialGradient c={vec(0, 100)} r={600} colors={[color, 'transparent']} />
		</Rect>
	);
};

const ZigZag = ({ color }: { color: string }): ReactElement => {
	const step = 12;
	let n = 0;
	const path = Skia.Path.Make();
	path.moveTo(0, 0);
	do {
		path.lineTo((n + 1) * step, step);
		path.lineTo((n + 2) * step, 0);
		n += 2;
	} while (n < 100);
	path.close();

	return <Path path={path} color={color} />;
};

const OnchainActivityDetail = ({
	item,
	navigation,
	extended,
}: {
	item: TOnchainActivityItem;
	navigation: RootNavigationProp;
	extended?: boolean;
}): ReactElement => {
	const {
		id,
		activityType,
		txType,
		value,
		fee,
		confirmed,
		timestamp,
		isBoosted,
		address,
	} = item;

	const { t } = useTranslation('wallet');
	const tags = useAppSelector((state) => tagSelector(state, id));
	const selectedNetwork = useSelector(selectedNetworkSelector);
	const activityItems = useSelector(activityItemsSelector);
	const boostedTransactions = useSelector(boostedTransactionsSelector);
	const feeDisplay = useDisplayValues(btcToSats(fee));
	const [txDetails, setTxDetails] = useState<ITransaction<ITxHash>['result']>();
	const slashTagsUrl = useAppSelector((state) => {
		return slashTagsUrlSelector(state, id);
	});

	useEffect(() => {
		if (txDetails || !extended) {
			return;
		}

		getTransactions({ txHashes: [{ tx_hash: id }], selectedNetwork }).then(
			(txResponse) => {
				if (txResponse.isErr()) {
					showErrorNotification({
						title: t('activity_error_get'),
						message: txResponse.error.message,
					});
					return;
				}
				const txData = txResponse.value.data;
				if (txData.length === 0) {
					showErrorNotification({
						title: t('activity_error_get'),
						message: t('activity_error_tx_not_found'),
					});
					return;
				}
				const data = txData[0].result;
				setTxDetails(data);
			},
		);
	}, [id, activityType, extended, selectedNetwork, txDetails, t]);

	const showBoost = useMemo(() => {
		if (confirmed || isBoosted) {
			return false;
		}
		return canBoost(id).canBoost;
	}, [confirmed, isBoosted, id]);

	const boostedParents = useMemo(() => {
		return getBoostedTransactionParents({
			txid: id,
			boostedTransactions,
		});
	}, [boostedTransactions, id]);

	const hasBoostedParents = useMemo(() => {
		return boostedParents.length > 0;
	}, [boostedParents.length]);

	const handleBoostParentPress = useCallback(
		(parentTxId) => {
			const activityItem = activityItems.find((i) => i.id === parentTxId);
			if (activityItem) {
				navigation.push('ActivityDetail', { id: activityItem.id });
			}
		},
		[activityItems, navigation],
	);

	const handleBoost = (): void => {
		showBottomSheet('boostPrompt', { activityItem: item });
	};

	const handleAddTag = (): void => {
		showBottomSheet('activityTagsPrompt', { id });
	};

	const handleRemoveTag = (tag: string): void => {
		deleteMetaTxTag(id, tag);
	};

	const handleAssign = (): void => {
		navigation.navigate('ActivityAssignContact', { txid: id });
	};

	const handleDetach = (): void => {
		deleteMetaSlashTagsUrlTag(id);
	};

	const navigateToContact = (url: string): void => {
		navigation.navigate('Contact', { url });
	};

	const blockExplorerUrl = getBlockExplorerLink(id);

	const handleBlockExplorerOpen = useCallback(async () => {
		await openURL(blockExplorerUrl);
	}, [blockExplorerUrl]);

	const copyTransactionId = useCallback(() => {
		Clipboard.setString(id);
		showInfoNotification({
			title: t('activity_copied_tx'),
			message: t('activity_copied_tx_text'),
		});
	}, [id, t]);

	const getOutputAddresses = useCallback(() => {
		if (txDetails && txDetails.vout.length > 0) {
			return txDetails.vout.map(({ n, scriptPubKey }) => {
				const outputAddress = scriptPubKey?.addresses
					? scriptPubKey?.addresses[0]
					: scriptPubKey.address;
				const i = `${outputAddress}${n}`;
				return (
					<View key={i}>
						<Text02M numberOfLines={1} ellipsizeMode="middle">
							{outputAddress}
						</Text02M>
					</View>
				);
			});
		}
		return <View />;
	}, [txDetails]);

	const isSend = txType === EPaymentType.sent;

	let status = (
		<View style={styles.row}>
			<HourglassIcon style={styles.rowIcon} color="brand" width={16} />
			<Text02M color="brand">{t('activity_confirming')}</Text02M>
		</View>
	);

	if (isBoosted) {
		status = (
			<View style={styles.row}>
				<TimerIconAlt style={styles.rowIcon} color="yellow" height={14} />
				<Text02M color="yellow">{t('activity_boosting')}</Text02M>
			</View>
		);
	}

	if (confirmed) {
		status = (
			<View style={styles.row}>
				<CheckCircleIcon style={styles.rowIcon} color="green" />
				<Text02M color="green">{t('activity_confirmed')}</Text02M>
			</View>
		);
	}

	return (
		<>
			<Money
				sats={value}
				unit={EBalanceUnit.fiat}
				size="caption13M"
				color="gray1"
			/>
			<View style={styles.title}>
				<View style={styles.titleBlock}>
					<Money sats={value} sign={isSend ? '- ' : '+ '} />
				</View>

				<ThemedView
					color={isSend ? 'red16' : 'green16'}
					style={styles.iconContainer}>
					{isSend ? (
						<SendIcon height={19} color="red" />
					) : (
						<ReceiveIcon height={19} color="green" />
					)}
				</ThemedView>
			</View>

			<View style={styles.sectionContainer}>
				<Section
					title={t('activity_fee')}
					value={
						<View style={styles.row}>
							<TimerIcon style={styles.rowIcon} color="brand" />
							<Text02M>
								{feeDisplay.satoshis} ({feeDisplay.fiatSymbol}
								{feeDisplay.fiatFormatted})
							</Text02M>
						</View>
					}
				/>
				<Section title={t('activity_status')} value={status} />
			</View>

			<View style={styles.sectionContainer}>
				<Section
					title={t('activity_date')}
					value={
						<View style={styles.row}>
							<CalendarIcon style={styles.rowIcon} color="brand" width={16} />
							<Text02M>
								{t('intl:dateTime', {
									v: new Date(timestamp),
									formatParams: {
										v: {
											month: 'long',
											day: 'numeric',
										},
									},
								})}
							</Text02M>
						</View>
					}
				/>
				<Section
					title={t('activity_time')}
					value={
						<View style={styles.row}>
							<ClockIcon style={styles.rowIcon} color="brand" />
							<Text02M>
								{t('intl:dateTime', {
									v: new Date(timestamp),
									formatParams: {
										v: {
											hour: 'numeric',
											minute: 'numeric',
											hour12: false,
										},
									},
								})}
							</Text02M>
						</View>
					}
				/>
			</View>

			{!extended ? (
				<>
					{(tags.length !== 0 || slashTagsUrl) && (
						<View style={styles.sectionContainer}>
							{slashTagsUrl && (
								<Section
									title={t('activity_contact')}
									value={
										<ContactSmall
											url={slashTagsUrl}
											onPress={(): void => navigateToContact(slashTagsUrl)}
										/>
									}
								/>
							)}
							<Section
								title={t('tags')}
								value={
									<View style={styles.tagsContainer}>
										{tags.map((tag, index) => (
											<Tag
												key={tag}
												value={tag}
												style={styles.tag}
												onClose={(): void => handleRemoveTag(tag)}
												testID={`ActivityTag-${index}`}
											/>
										))}
									</View>
								}
							/>
						</View>
					)}

					<View>
						<View style={styles.sectionContainer}>
							{slashTagsUrl ? (
								<Button
									style={styles.button}
									text={t('activity_detach')}
									icon={<UserMinusIcon height={16} width={16} color="brand" />}
									onPress={handleDetach}
								/>
							) : (
								<Button
									style={styles.button}
									text={t('activity_assign')}
									icon={<UserPlusIcon height={16} width={16} color="brand" />}
									onPress={handleAssign}
								/>
							)}
							<Button
								style={styles.button}
								text={t('activity_tag')}
								icon={<TagIcon height={16} width={16} color="brand" />}
								onPress={handleAddTag}
								testID="ActivityTag"
							/>
						</View>
						<View style={styles.sectionContainer}>
							<Button
								style={styles.button}
								text={t(isBoosted ? 'activity_boosted' : 'activity_boost')}
								icon={<TimerIconAlt color="brand" />}
								disabled={!showBoost}
								onPress={handleBoost}
							/>
							<Button
								style={styles.button}
								text={t('activity_explore')}
								icon={<GitBranchIcon color="brand" />}
								disabled={!blockExplorerUrl}
								onPress={handleBlockExplorerOpen}
							/>
						</View>
					</View>

					<View style={styles.buttonDetailsContainer}>
						<Button
							text={t('activity_tx_details')}
							size="large"
							testID="ActivityTxDetails"
							onPress={(): void =>
								navigation.push('ActivityDetail', {
									id: item.id,
									extended: true,
								})
							}
						/>
					</View>
				</>
			) : (
				<>
					<TouchableOpacity
						onPress={copyTransactionId}
						style={styles.sectionContainer}>
						<Section
							title={t('activity_tx_id')}
							value={<Text02M>{id}</Text02M>}
						/>
					</TouchableOpacity>
					<View style={styles.sectionContainer}>
						<Section
							title={t('activity_address')}
							value={<Text02M>{address}</Text02M>}
						/>
					</View>
					{txDetails ? (
						<>
							<View style={styles.sectionContainer}>
								<Section
									title={t('activity_input', { count: txDetails.vin.length })}
									value={txDetails.vin.map((v) => {
										const txid = v.txid;
										const vout = v.vout;
										const i = txid + ':' + vout;
										return <Text02M key={i}>{i}</Text02M>;
									})}
								/>
							</View>
							<View style={styles.sectionContainer}>
								<Section
									title={t('activity_output', {
										count: txDetails.vout.length,
									})}
									value={getOutputAddresses()}
								/>
							</View>
						</>
					) : (
						<ActivityIndicator size="small" />
					)}

					{hasBoostedParents && (
						<>
							{boostedParents.map((parent, i) => {
								const title =
									boostedTransactions[parent].type === EBoostType.rbf
										? t('activity_boosted_rbf', { num: i + 1 })
										: t('activity_boosted_cpfp', { num: i + 1 });

								return (
									<View key={parent} style={styles.sectionContainer}>
										<Section
											title={title}
											value={
												<TouchableOpacity
													onPress={(): void => {
														handleBoostParentPress(parent);
													}}>
													<Text02M numberOfLines={1} ellipsizeMode={'middle'}>
														{parent}
													</Text02M>
												</TouchableOpacity>
											}
										/>
									</View>
								);
							})}
						</>
					)}

					<View style={styles.buttonDetailsContainer}>
						<Button
							text={t('activity_explorer')}
							size="large"
							disabled={!blockExplorerUrl}
							onPress={handleBlockExplorerOpen}
						/>
					</View>
				</>
			)}
		</>
	);
};

const LightningActivityDetail = ({
	item,
	navigation,
	extended,
}: {
	item: TLightningActivityItem;
	navigation: RootNavigationProp;
	extended?: boolean;
}): ReactElement => {
	const { t } = useTranslation('wallet');
	const colors = useColors();
	const { id, txType, value, message, timestamp, address } = item;
	const tags = useSelector((state: Store) => tagSelector(state, id));
	const slashTagsUrl = useSelector((state: Store) => {
		return slashTagsUrlSelector(state, id);
	});

	const handleAddTag = (): void => {
		showBottomSheet('activityTagsPrompt', { id });
	};

	const handleRemoveTag = (tag: string): void => {
		deleteMetaTxTag(id, tag);
	};

	const handleAssign = (): void => {
		navigation.navigate('ActivityAssignContact', { txid: id });
	};

	const handleDetach = (): void => {
		deleteMetaSlashTagsUrlTag(id);
	};

	const navigateToContact = (url: string): void => {
		navigation.navigate('Contact', { url });
	};

	const copyTransactionId = useCallback(() => {
		Clipboard.setString(id);
		showInfoNotification({
			title: t('activity_copied_tx'),
			message: t('activity_copied_tx_text'),
		});
	}, [id, t]);

	const isSend = txType === EPaymentType.sent;

	const status = (
		<View style={styles.row}>
			<LightningIcon style={styles.rowIcon} color="purple" />
			<Text02M color="purple">{t('activity_successful')}</Text02M>
		</View>
	);

	return (
		<>
			<Money
				sats={value}
				unit={EBalanceUnit.fiat}
				size="caption13M"
				color="gray1"
			/>
			<View style={styles.title}>
				<View style={styles.titleBlock}>
					<Money sats={value} sign={isSend ? '- ' : '+ '} />
				</View>

				<ThemedView
					color={isSend ? 'red16' : 'green16'}
					style={styles.iconContainer}>
					{isSend ? (
						<SendIcon height={19} color="red" />
					) : (
						<ReceiveIcon height={19} color="green" />
					)}
				</ThemedView>
			</View>

			<View style={styles.sectionContainer}>
				<Section
					title={t('activity_fee')}
					value={
						<View style={styles.row}>
							<SpeedFastIcon
								style={styles.rowIcon}
								color="purple"
								width={16}
								height={16}
							/>
							{/* TODO: get actual fee */}
							<Text02M>$0.01</Text02M>
						</View>
					}
				/>
				<Section title={t('activity_status')} value={status} />
			</View>

			<View style={styles.sectionContainer}>
				<Section
					title={t('activity_date')}
					value={
						<View style={styles.row}>
							<CalendarIcon style={styles.rowIcon} color="purple" />
							<Text02M>
								{t('intl:dateTime', {
									v: new Date(timestamp),
									formatParams: {
										v: {
											month: 'long',
											day: 'numeric',
										},
									},
								})}
							</Text02M>
						</View>
					}
				/>
				<Section
					title={t('activity_time')}
					value={
						<View style={styles.row}>
							<ClockIcon style={styles.rowIcon} color="purple" />
							<Text02M>
								{t('intl:dateTime', {
									v: new Date(timestamp),
									formatParams: {
										v: {
											hour: 'numeric',
											minute: 'numeric',
											hour12: false,
										},
									},
								})}
							</Text02M>
						</View>
					}
				/>
			</View>

			{!extended ? (
				<>
					{(tags.length !== 0 || slashTagsUrl) && (
						<View style={styles.sectionContainer}>
							{slashTagsUrl && (
								<Section
									title={t('activity_contact')}
									value={
										<ContactSmall
											url={slashTagsUrl}
											onPress={(): void => navigateToContact(slashTagsUrl)}
										/>
									}
								/>
							)}
							<Section
								title={t('tags')}
								value={
									<View style={styles.tagsContainer}>
										{tags.map((tag) => (
											<Tag
												key={tag}
												value={tag}
												style={styles.tag}
												onClose={(): void => handleRemoveTag(tag)}
											/>
										))}
									</View>
								}
							/>
						</View>
					)}

					{message ? (
						<View style={styles.invoiceNote}>
							<Caption13M style={styles.sText} color="gray1">
								{t('activity_invoice_note')}
							</Caption13M>
							<ThemedView color="gray5">
								<Canvas style={styles.zRoot}>
									<ZigZag color={colors.background} />
								</Canvas>
								<View style={styles.note}>
									<Title>{message}</Title>
								</View>
							</ThemedView>
						</View>
					) : null}

					<View>
						<View style={styles.sectionContainer}>
							{slashTagsUrl ? (
								<Button
									style={styles.button}
									text={t('activity_detach')}
									icon={<UserMinusIcon height={16} width={16} color="brand" />}
									onPress={handleDetach}
								/>
							) : (
								<Button
									style={styles.button}
									text={t('activity_assign')}
									icon={<UserPlusIcon height={16} width={16} color="brand" />}
									onPress={handleAssign}
								/>
							)}
							<Button
								style={styles.button}
								text={t('activity_tag')}
								icon={<TagIcon height={16} width={16} color="brand" />}
								onPress={handleAddTag}
							/>
						</View>
					</View>

					<View style={styles.buttonDetailsContainer}>
						<Button
							text={t('activity_tx_details')}
							size="large"
							onPress={(): void =>
								navigation.push('ActivityDetail', {
									id: item.id,
									extended: true,
								})
							}
						/>
					</View>
				</>
			) : (
				<>
					<TouchableOpacity
						onPress={copyTransactionId}
						style={styles.sectionContainer}>
						<Section
							title={t('activity_tx_id')}
							value={<Text02M>{id}</Text02M>}
						/>
					</TouchableOpacity>
					<View style={styles.sectionContainer}>
						<Section
							title={t('activity_invoice')}
							value={<Text02M>{address}</Text02M>}
						/>
					</View>
				</>
			)}
		</>
	);
};

const ActivityDetail = ({
	navigation,
	route,
}: RootStackScreenProps<'ActivityDetail'>): ReactElement => {
	const { t } = useTranslation('wallet');
	const extended = route.params.extended ?? false;
	const colors = useColors();
	const [size, setSize] = useState({ width: 0, height: 0 });

	const item = useAppSelector((state) => {
		return activityItemSelector(state, route.params.id)!;
	});

	// if (!item) {
	// 	return <></>;
	// }

	const { activityType, txType } = item;
	const isSend = txType === EPaymentType.sent;

	const handleLayout = (e): void => {
		const { height, width } = e.nativeEvent.layout;
		setSize((s) => (s.width === 0 ? { width, height } : s));
	};

	let title = isSend
		? t('activity_bitcoin_sent')
		: t('activity_bitcoin_received');
	let glowColor = colors.brand;

	if (activityType === EActivityType.lightning) {
		glowColor = colors.purple;
	}

	if (activityType === EActivityType.tether) {
		title = isSend ? t('activity_tether_sent') : t('activity_tether_received');
		glowColor = colors.green;
	}

	return (
		<SafeAreaView onLayout={handleLayout}>
			<Canvas style={[styles.canvas, size]}>
				<Glow color={glowColor} size={size} />
			</Canvas>
			<NavigationHeader
				title={title}
				onClosePress={(): void => {
					navigation.goBack();
					navigation.goBack();
				}}
			/>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}>
				{activityType === EActivityType.onchain && (
					<OnchainActivityDetail
						item={item}
						navigation={navigation}
						extended={extended}
					/>
				)}
				{activityType === EActivityType.lightning && (
					<LightningActivityDetail
						item={item}
						navigation={navigation}
						extended={extended}
					/>
				)}
				{/* {activityType === EActivityType.tether && (
					<TetherActivityDetail item={item} />
				)} */}
				<SafeAreaInsets type="bottom" />
			</ScrollView>
			<ActivityTagsPrompt />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingHorizontal: 16,
		flexGrow: 1,
		position: 'relative',
	},
	canvas: {
		position: 'absolute',
	},
	title: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 32,
	},
	titleBlock: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 3,
	},
	iconContainer: {
		borderRadius: 30,
		overflow: 'hidden',
		height: 48,
		width: 48,
		justifyContent: 'center',
		alignItems: 'center',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	rowIcon: {
		marginRight: 9,
	},
	sectionContainer: {
		marginHorizontal: -8,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	sRoot: {
		paddingBottom: 10,
		marginHorizontal: 8,
		marginBottom: 16,
		borderBottomWidth: 1,
		flex: 1,
	},
	sText: {
		marginBottom: 8,
	},
	invoiceNote: {
		marginBottom: 16,
	},
	note: {
		padding: 24,
	},
	buttonDetailsContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		marginBottom: 16,
	},
	button: {
		marginHorizontal: 8,
		marginBottom: 16,
		flex: 1,
	},
	zRoot: {
		height: 12,
	},
	tagsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: -8,
	},
	tag: {
		marginRight: 8,
		marginBottom: 8,
	},
});

export default memo(ActivityDetail);
