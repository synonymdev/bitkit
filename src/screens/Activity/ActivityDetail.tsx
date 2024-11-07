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
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import Clipboard from '@react-native-clipboard/clipboard';
import { useTranslation } from 'react-i18next';
import { parse } from '@synonymdev/slashtags-url';
import { EBoostType, EPaymentType } from 'beignet';

import { View as ThemedView } from '../../styles/components';
import { Caption13Up, BodySSB, Title } from '../../styles/text';
import {
	CalendarIcon,
	CheckCircleIcon,
	ClockIcon,
	GitBranchIcon,
	HourglassIcon,
	HourglassSimpleIcon,
	LightningHollow,
	LightningIcon,
	ReceiveIcon,
	SendIcon,
	TagIcon,
	TimerIcon,
	TimerIconAlt,
	TransferIcon,
	UserIcon,
	UserMinusIcon,
	UserPlusIcon,
	XIcon,
} from '../../styles/icons';
import Button from '../../components/buttons/Button';
import Money from '../../components/Money';
import ContactSmall from '../../components/ContactSmall';
import NavigationHeader from '../../components/NavigationHeader';
import SafeAreaInset from '../../components/SafeAreaInset';
import Tag from '../../components/Tag';
import ActivityTagsPrompt from './ActivityTagsPrompt';
import {
	EActivityType,
	TLightningActivityItem,
	TOnchainActivityItem,
} from '../../store/types/activity';
import {
	canBoost,
	getBlockExplorerLink,
} from '../../utils/wallet/transactions';
import useColors from '../../hooks/colors';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';

import { showBottomSheet } from '../../store/utils/ui';
import {
	activityItemSelector,
	activityItemsSelector,
} from '../../store/reselect/activity';
import {
	deleteMetaTxTag,
	deleteMetaTxSlashtagsUrl,
} from '../../store/slices/metadata';
import { getTransactions } from '../../utils/wallet/electrum';
import { ITransaction, ITxHash } from '../../utils/wallet';
import { ellipsis, getDurationForBlocks, openURL } from '../../utils/helpers';
import { getBoostedTransactionParents } from '../../utils/boost';
import { showToast } from '../../utils/notifications';
import {
	boostedTransactionsSelector,
	selectedNetworkSelector,
	transferSelector,
} from '../../store/reselect/wallet';
import {
	slashTagsUrlSelector,
	tagSelector,
} from '../../store/reselect/metadata';
import type {
	RootNavigationProp,
	RootStackScreenProps,
} from '../../navigation/types';
import { i18nTime } from '../../utils/i18n';
import { useSwitchUnit } from '../../hooks/wallet';
import { contactsSelector } from '../../store/reselect/slashtags';
import { ETransferStatus } from '../../store/types/wallet';

const Section = memo(
	({ title, value }: { title: string; value: ReactNode }) => {
		const { white10 } = useColors();

		return (
			<View style={[styles.sRoot, { borderBottomColor: white10 }]}>
				<View style={styles.sText}>
					<Caption13Up color="secondary">{title}</Caption13Up>
				</View>
				<View style={styles.sText}>{value}</View>
			</View>
		);
	},
);

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
		txId,
		transferTxId,
		activityType,
		txType,
		value,
		fee,
		confirmed,
		timestamp,
		confirmTimestamp,
		isTransfer,
		isBoosted,
		exists,
	} = item;

	const isSend = txType === EPaymentType.sent;
	const total = isSend ? fee + value : value;

	const { t } = useTranslation('wallet');
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const switchUnit = useSwitchUnit();
	const dispatch = useAppDispatch();
	const contacts = useAppSelector(contactsSelector);
	const tags = useAppSelector((state) => tagSelector(state, id));
	const selectedNetwork = useAppSelector(selectedNetworkSelector);
	const activityItems = useAppSelector(activityItemsSelector);
	const boostedTransactions = useAppSelector(boostedTransactionsSelector);
	const transfer = useAppSelector((state) => {
		return transferSelector(state, transferTxId);
	});
	const [txDetails, setTxDetails] = useState<ITransaction<ITxHash>['result']>();
	const slashTagsUrl = useAppSelector((state) => {
		return slashTagsUrlSelector(state, id);
	});

	useEffect(() => {
		if (txDetails || !extended) {
			return;
		}

		getTransactions({ txHashes: [{ tx_hash: txId }] }).then((txResponse) => {
			if (txResponse.isErr()) {
				showToast({
					type: 'warning',
					title: t('activity_error_get'),
					description: t('activity_error_get_description'),
				});
				return;
			}
			const txData = txResponse.value.data;
			if (txData.length === 0) {
				showToast({
					type: 'warning',
					title: t('activity_error_get'),
					description: t('activity_error_tx_not_found'),
				});
				return;
			}
			const data = txData[0].result;
			setTxDetails(data);
		});
	}, [txId, activityType, extended, selectedNetwork, txDetails, t]);

	const showBoost = useMemo(() => {
		if (confirmed || isBoosted) {
			return false;
		}
		return canBoost(txId).canBoost;
	}, [confirmed, isBoosted, txId]);

	const boostedParents = useMemo(() => {
		return getBoostedTransactionParents({
			txId,
			boostedTransactions,
		});
	}, [boostedTransactions, txId]);

	const hasBoostedParents = useMemo(() => {
		return boostedParents.length > 0;
	}, [boostedParents.length]);

	const handleBoostParentPress = (parentTxId): void => {
		const activityItem = activityItems.find((i) => {
			return i.activityType === EActivityType.onchain && i.txId === parentTxId;
		});
		if (activityItem) {
			navigation.push('ActivityDetail', { id: activityItem.id });
		} else {
			onCopy(parentTxId);
		}
	};

	const handleBoost = (): void => {
		showBottomSheet('boostPrompt', { onchainActivityItem: item });
	};

	const handleAddTag = (): void => {
		showBottomSheet('activityTagsPrompt', { id });
	};

	const handleRemoveTag = (tag: string): void => {
		dispatch(deleteMetaTxTag({ txId: id, tag }));
	};

	const handleAssign = (): void => {
		navigation.navigate('ActivityAssignContact', { txid: id });
	};

	const handleDetach = (): void => {
		dispatch(deleteMetaTxSlashtagsUrl(id));
	};

	const navigateToContact = (url: string): void => {
		const hasContact = Object.keys(contacts).includes(parse(url).id);
		if (hasContact) {
			navigation.navigate('Contact', { url });
		} else {
			navigation.navigate('ContactEdit', { url });
		}
	};

	const blockExplorerUrl = getBlockExplorerLink(txId);

	const handleExplore = (): void => {
		navigation.push('ActivityDetail', {
			id: item.id,
			extended: true,
		});
	};

	const handleBlockExplorerOpen = useCallback(async () => {
		await openURL(blockExplorerUrl);
	}, [blockExplorerUrl]);

	const onCopy = (text: string): void => {
		Clipboard.setString(text);
		showToast({
			type: 'success',
			title: t('copied'),
			description: ellipsis(text, 40),
		});
	};

	const getOutputAddresses = useCallback(() => {
		if (txDetails && txDetails.vout.length > 0) {
			return txDetails.vout.map(({ n, scriptPubKey }) => {
				const outputAddress = scriptPubKey?.addresses
					? scriptPubKey?.addresses[0]
					: scriptPubKey.address;
				const i = `${outputAddress}${n}`;
				return (
					<View key={i}>
						<BodySSB numberOfLines={1} ellipsizeMode="middle">
							{outputAddress}
						</BodySSB>
					</View>
				);
			});
		}
		return <View />;
	}, [txDetails]);

	let fees = fee;
	let paymentAmount = value;
	let status = (
		<View style={styles.row}>
			<HourglassIcon style={styles.rowIcon} color="brand" width={16} />
			<BodySSB color="brand">{t('activity_confirming')}</BodySSB>
		</View>
	);
	let icon = isSend ? (
		<ThemedView style={styles.icon} color="brand16">
			<SendIcon height={19} color="brand" />
		</ThemedView>
	) : (
		<ThemedView style={styles.icon} color="brand16">
			<ReceiveIcon height={19} color="brand" />
		</ThemedView>
	);

	if (transfer) {
		fees = value - transfer.amount + fee;
		paymentAmount = transfer.amount;

		if (transfer.status !== ETransferStatus.done) {
			const duration = getDurationForBlocks(transfer.confirmsIn);
			status = (
				<View style={styles.row}>
					<HourglassIcon style={styles.rowIcon} color="brand" width={16} />
					<BodySSB color="brand">
						{t('activity_transfer_pending', { duration })}
					</BodySSB>
				</View>
			);
		}
		icon = (
			<ThemedView style={styles.icon} color="brand16">
				<TransferIcon height={24} width={24} color="brand" />
			</ThemedView>
		);
	}

	if (isBoosted) {
		status = (
			<View testID="StatusBoosting" style={styles.row}>
				<TimerIconAlt style={styles.rowIcon} color="yellow" height={14} />
				<BodySSB color="yellow">{t('activity_boosting')}</BodySSB>
			</View>
		);
	}

	if (confirmed) {
		status = (
			<View testID="StatusConfirmed" style={styles.row}>
				<CheckCircleIcon style={styles.rowIcon} color="green" />
				<BodySSB color="green">{t('activity_confirmed')}</BodySSB>
			</View>
		);
	}

	if (activityType === EActivityType.onchain && !exists) {
		status = (
			<View style={styles.row}>
				<XIcon style={styles.rowIcon} color="red" height={18} width={16} />
				<BodySSB color="red">{t('activity_removed')}</BodySSB>
			</View>
		);
	}

	return (
		<>
			<Money
				sats={total}
				size="caption13Up"
				color="secondary"
				unitType="secondary"
				symbol={true}
			/>
			<TouchableOpacity
				style={styles.title}
				activeOpacity={0.7}
				onPress={switchUnit}>
				<View style={styles.titleBlock}>
					<Money sats={total} sign={isSend ? '- ' : '+ '} />
				</View>

				{icon}
			</TouchableOpacity>

			{!extended ? (
				<>
					<View style={styles.sectionContainer}>
						<Section title={t('activity_status')} value={status} />
					</View>

					<View style={styles.sectionContainer}>
						<Section
							title={t('activity_date')}
							value={
								<View style={styles.row}>
									<CalendarIcon
										style={styles.rowIcon}
										color="brand"
										width={16}
									/>
									<BodySSB>
										{tTime('dateTime', {
											v: new Date(timestamp),
											formatParams: {
												v: {
													month: 'long',
													day: 'numeric',
												},
											},
										})}
									</BodySSB>
								</View>
							}
						/>
						<Section
							title={t('activity_time')}
							value={
								<View style={styles.row}>
									<ClockIcon style={styles.rowIcon} color="brand" />
									<BodySSB>
										{tTime('dateTime', {
											v: new Date(confirmed ? confirmTimestamp! : timestamp),
											formatParams: {
												v: {
													hour: 'numeric',
													minute: 'numeric',
													hour12: false,
												},
											},
										})}
									</BodySSB>
								</View>
							}
						/>
					</View>

					{isSend && (
						<View style={styles.sectionContainer}>
							{isTransfer ? (
								<Section
									title={t('activity_transfer_to_spending')}
									value={
										<View testID="ActivityAmount" style={styles.row}>
											<LightningHollow
												style={styles.rowIcon}
												width={16}
												height={16}
												color="brand"
											/>
											<Money
												style={styles.moneyMargin}
												sats={paymentAmount}
												size="bodySSB"
											/>
										</View>
									}
								/>
							) : (
								<Section
									title={t('activity_payment')}
									value={
										<View testID="ActivityAmount" style={styles.row}>
											<UserIcon
												style={styles.rowIcon}
												width={16}
												height={16}
												color="brand"
											/>
											<Money
												style={styles.moneyMargin}
												sats={paymentAmount}
												size="bodySSB"
											/>
										</View>
									}
								/>
							)}

							<Section
								title={t('activity_fee')}
								value={
									<View testID="ActivityFee" style={styles.row}>
										<TimerIcon style={styles.rowIcon} color="brand" />
										<Money
											sats={fees}
											size="bodySSB"
											style={styles.moneyMargin}
										/>
									</View>
								}
							/>
						</View>
					)}

					{(tags.length !== 0 || slashTagsUrl) && (
						<View style={styles.sectionContainer}>
							{slashTagsUrl && (
								<Section
									title={t('activity_contact')}
									value={
										<ContactSmall
											url={slashTagsUrl}
											onPress={(): void => navigateToContact(slashTagsUrl)}
											testID="ContactSmall"
										/>
									}
								/>
							)}
							<Section
								title={t('tags')}
								value={
									<View style={styles.tagsContainer} testID="ActivityTags">
										{tags.map((tag) => (
											<Tag
												key={tag}
												style={styles.tag}
												value={tag}
												onDelete={(): void => handleRemoveTag(tag)}
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
									testID="ActivityDetach"
									onPress={handleDetach}
								/>
							) : (
								<Button
									style={styles.button}
									text={t('activity_assign')}
									icon={<UserPlusIcon height={16} width={16} color="brand" />}
									disabled={isTransfer}
									testID="ActivityAssign"
									onPress={handleAssign}
								/>
							)}
							<Button
								style={styles.button}
								text={t('activity_tag')}
								icon={<TagIcon height={16} width={16} color="brand" />}
								testID="ActivityTag"
								onPress={handleAddTag}
							/>
						</View>
						<View style={styles.sectionContainer}>
							<Button
								style={styles.button}
								text={t(isBoosted ? 'activity_boosted' : 'activity_boost')}
								icon={<TimerIconAlt color="brand" />}
								disabled={!showBoost}
								testID={
									isBoosted
										? 'BoostedButton'
										: showBoost
										? 'BoostButton'
										: 'BoostDisabled'
								}
								onPress={handleBoost}
							/>
							<Button
								style={styles.button}
								text={t('activity_explore')}
								icon={<GitBranchIcon color="brand" />}
								disabled={!blockExplorerUrl}
								testID="ActivityTxDetails"
								onPress={handleExplore}
							/>
						</View>
					</View>
				</>
			) : (
				<>
					<TouchableOpacity
						style={styles.sectionContainer}
						activeOpacity={0.7}
						onPress={(): void => onCopy(txId)}>
						<Section
							title={t('activity_tx_id')}
							value={<BodySSB testID="TXID">{txId}</BodySSB>}
						/>
					</TouchableOpacity>
					{txDetails ? (
						<>
							<View style={styles.sectionContainer}>
								<Section
									title={t('activity_input', { count: txDetails.vin.length })}
									value={txDetails.vin.map((v) => {
										const input = `${v.txid}:${v.vout}`;
										return <BodySSB key={input}>{input}</BodySSB>;
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
								const rbf = boostedTransactions[parent].type === EBoostType.rbf;
								const testID = rbf ? 'RBFBoosted' : 'CPFPBoosted';
								const title = rbf
									? t('activity_boosted_rbf', { num: i + 1 })
									: t('activity_boosted_cpfp', { num: i + 1 });

								return (
									<View
										testID={testID}
										key={parent}
										style={styles.sectionContainer}>
										<TouchableOpacity
											activeOpacity={0.7}
											onPress={(): void => {
												handleBoostParentPress(parent);
											}}>
											<Section
												title={title}
												value={<BodySSB>{parent}</BodySSB>}
											/>
										</TouchableOpacity>
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
	const { t: tTime } = useTranslation('intl', { i18n: i18nTime });
	const switchUnit = useSwitchUnit();
	const colors = useColors();
	const {
		id,
		txType,
		status,
		value,
		fee,
		message,
		timestamp,
		address,
		preimage,
	} = item;

	const dispatch = useAppDispatch();
	const tags = useAppSelector((state) => tagSelector(state, id));
	const slashTagsUrl = useAppSelector((state) => {
		return slashTagsUrlSelector(state, id);
	});

	const handleAddTag = (): void => {
		showBottomSheet('activityTagsPrompt', { id });
	};

	const handleRemoveTag = (tag: string): void => {
		dispatch(deleteMetaTxTag({ txId: id, tag }));
	};

	const handleAssign = (): void => {
		navigation.navigate('ActivityAssignContact', { txid: id });
	};

	const handleDetach = (): void => {
		dispatch(deleteMetaTxSlashtagsUrl(id));
	};

	const navigateToContact = (url: string): void => {
		navigation.navigate('Contact', { url });
	};

	const handleExplore = (): void => {
		navigation.push('ActivityDetail', {
			id: item.id,
			extended: true,
		});
	};

	const onCopy = (text: string): void => {
		Clipboard.setString(text);
		showToast({
			type: 'success',
			title: t('copied'),
			description: ellipsis(text, 40),
		});
	};

	const isSend = txType === EPaymentType.sent;
	const total = value + (fee ?? 0);

	let statusText = t('activity_successful');
	let statusIcon = (
		<LightningIcon style={styles.rowIcon} width={12} color="purple" />
	);
	let icon = (
		<>
			{isSend ? (
				<SendIcon height={19} color="purple" />
			) : (
				<ReceiveIcon height={19} color="purple" />
			)}
		</>
	);

	if (status === 'pending') {
		statusText = t('activity_pending');
		statusIcon = (
			<HourglassSimpleIcon style={styles.rowIcon} color="purple" width={16} />
		);
		icon = (
			<>
				<HourglassSimpleIcon color="purple" width={24} />
			</>
		);
	}
	if (status === 'failed') {
		statusText = t('activity_failed');
		statusIcon = <XIcon style={styles.rowIcon} color="purple" width={16} />;
		icon = (
			<>
				<XIcon color="purple" width={24} />
			</>
		);
	}

	const StatusRow = (
		<View style={styles.row}>
			{statusIcon}
			<BodySSB color="purple">{statusText}</BodySSB>
		</View>
	);

	return (
		<>
			<Money
				sats={total}
				unitType="secondary"
				size="caption13Up"
				color="secondary"
				symbol={true}
			/>
			<TouchableOpacity
				style={styles.title}
				activeOpacity={0.7}
				onPress={switchUnit}>
				<View style={styles.titleBlock}>
					<Money sats={total} sign={isSend ? '- ' : '+ '} />
				</View>

				<ThemedView style={styles.icon} color="purple16">
					{icon}
				</ThemedView>
			</TouchableOpacity>

			{!extended ? (
				<>
					<View style={styles.sectionContainer}>
						<Section title={t('activity_status')} value={StatusRow} />
					</View>

					<View style={styles.sectionContainer}>
						<Section
							title={t('activity_date')}
							value={
								<View style={styles.row}>
									<CalendarIcon style={styles.rowIcon} color="purple" />
									<BodySSB>
										{tTime('dateTime', {
											v: new Date(timestamp),
											formatParams: {
												v: {
													month: 'long',
													day: 'numeric',
												},
											},
										})}
									</BodySSB>
								</View>
							}
						/>
						<Section
							title={t('activity_time')}
							value={
								<View style={styles.row}>
									<ClockIcon style={styles.rowIcon} color="purple" />
									<BodySSB>
										{tTime('dateTime', {
											v: new Date(timestamp),
											formatParams: {
												v: {
													hour: 'numeric',
													minute: 'numeric',
													hour12: false,
												},
											},
										})}
									</BodySSB>
								</View>
							}
						/>
					</View>

					{isSend && (
						<View style={styles.sectionContainer}>
							<Section
								title={t('activity_payment')}
								value={
									<View style={styles.row}>
										<UserIcon
											style={styles.rowIcon}
											width={16}
											height={16}
											color="purple"
										/>
										<Money
											sats={value}
											size="bodySSB"
											style={styles.moneyMargin}
										/>
									</View>
								}
							/>

							{fee !== undefined && (
								<Section
									title={t('activity_fee')}
									value={
										<View style={styles.row}>
											<TimerIcon style={styles.rowIcon} color="purple" />
											<Money
												sats={fee}
												size="bodySSB"
												style={styles.moneyMargin}
											/>
										</View>
									}
								/>
							)}
						</View>
					)}

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
												style={styles.tag}
												value={tag}
												onDelete={(): void => handleRemoveTag(tag)}
											/>
										))}
									</View>
								}
							/>
						</View>
					)}

					{message ? (
						<View style={styles.invoiceNote}>
							<Caption13Up style={styles.sText} color="secondary">
								{t('activity_invoice_note')}
							</Caption13Up>
							<ThemedView color="white10">
								<Canvas style={styles.zRoot}>
									<ZigZag color={colors.background} />
								</Canvas>
								<View style={styles.note}>
									<Title testID="InvoiceNote">{message}</Title>
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
									icon={<UserMinusIcon height={16} width={16} color="purple" />}
									onPress={handleDetach}
								/>
							) : (
								<Button
									style={styles.button}
									text={t('activity_assign')}
									icon={<UserPlusIcon height={16} width={16} color="purple" />}
									onPress={handleAssign}
								/>
							)}
							<Button
								style={styles.button}
								text={t('activity_tag')}
								icon={<TagIcon height={16} width={16} color="purple" />}
								onPress={handleAddTag}
							/>
						</View>
						<View style={styles.sectionContainer}>
							<Button
								style={styles.button}
								text={t('activity_boost')}
								icon={<TimerIconAlt color="purple" />}
								disabled={true}
							/>
							<Button
								style={styles.button}
								text={t('activity_explore')}
								icon={<GitBranchIcon color="purple" />}
								testID="ActivityTxDetails"
								onPress={handleExplore}
							/>
						</View>
					</View>
				</>
			) : (
				<>
					{preimage && (
						<TouchableOpacity
							style={styles.sectionContainer}
							activeOpacity={0.7}
							onPress={(): void => onCopy(preimage)}>
							<Section
								title={t('activity_preimage')}
								value={<BodySSB>{preimage}</BodySSB>}
							/>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						style={styles.sectionContainer}
						activeOpacity={0.7}
						onPress={(): void => onCopy(id)}>
						<Section
							title={t('activity_payment_hash')}
							value={<BodySSB>{id}</BodySSB>}
						/>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.sectionContainer}
						activeOpacity={0.7}
						onPress={(): void => onCopy(address)}>
						<Section
							title={t('activity_invoice')}
							value={<BodySSB>{address}</BodySSB>}
						/>
					</TouchableOpacity>
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

	const item = useAppSelector((state) => {
		return activityItemSelector(state, route.params.id)!;
	});

	const { activityType, txType } = item;
	const isSend = txType === EPaymentType.sent;
	const isOnchain = activityType === EActivityType.onchain;
	const isTransfer = isOnchain && item.isTransfer;

	let title = isSend
		? t('activity_bitcoin_sent')
		: t('activity_bitcoin_received');

	if (isTransfer) {
		title = isSend
			? t('activity_transfer_spending_done')
			: t('activity_transfer_savings_done');
	}

	return (
		<ThemedView style={styles.root}>
			<SafeAreaInset type="top" />
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
				<SafeAreaInset type="bottom" minPadding={16} />
			</ScrollView>
			<ActivityTagsPrompt />
		</ThemedView>
	);
};

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingTop: 16,
		paddingHorizontal: 16,
		position: 'relative',
	},
	title: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 14,
		marginBottom: 24,
	},
	titleBlock: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	icon: {
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
		marginRight: 6,
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
	moneyMargin: {
		marginRight: 8,
	},
});

export default memo(ActivityDetail);
