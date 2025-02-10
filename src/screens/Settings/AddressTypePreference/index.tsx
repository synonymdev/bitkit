import { EAddressType } from 'beignet';
import React, { memo, ReactElement, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../../hooks/redux';

import { EItemType, IListData } from '../../../components/List';
import type { SettingsScreenProps } from '../../../navigation/types';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { dispatch } from '../../../store/helpers';
import { enableDevOptionsSelector } from '../../../store/reselect/settings';
import {
	addressTypeSelector,
	addressTypesToMonitorSelector,
} from '../../../store/reselect/wallet';
import { addressTypes } from '../../../store/shapes/wallet';
import { updateWallet } from '../../../store/slices/wallet';
import { showToast } from '../../../utils/notifications';
import { refreshWallet } from '../../../utils/wallet';
import SettingsView from '../SettingsView';

const AddressTypeSettings = ({
	navigation,
}: SettingsScreenProps<'AddressTypePreference'>): ReactElement => {
	const { t } = useTranslation('settings');
	const selectedAddressType = useAppSelector(addressTypeSelector);
	const isDeveloperMode = useAppSelector(enableDevOptionsSelector);

	const [hasShownMonitorNotification, setHasShownMonitorNotification] =
		useState(false);

	const availableAddressTypes = useMemo(() => {
		if (isDeveloperMode) {
			return Object.values(addressTypes);
		}
		return Object.values(addressTypes).filter(
			(addressType) => addressType.type !== EAddressType.p2tr,
		);
	}, [isDeveloperMode]);
	const addressTypesToMonitor = useAppSelector(addressTypesToMonitorSelector);

	const listData = useMemo((): IListData[] => {
		const data: IListData[] = [
			{
				title: t('adv.address_type'),
				data: Object.values(availableAddressTypes).map((addressType) => ({
					type: EItemType.button,
					title: `${addressType.name} ${addressType.example}`,
					subtitle: addressType.description,
					value: addressType.type === selectedAddressType,
					useCheckmark: true,
					onPress: async (): Promise<void> => {
						navigation.goBack();
						await updateSelectedAddressType({ addressType: addressType.type });
						await refreshWallet({ lightning: false });
					},
					testID: addressType.type,
				})),
			},
		];

		if (isDeveloperMode) {
			const monitoredTypes: IListData = {
				title: t('adv.monitored_address_types'),
				data: Object.values(availableAddressTypes).map((addressType) => ({
					type: EItemType.button,
					title: `${addressType.name} ${addressType.example}`,
					subtitle: addressType.description,
					value: addressTypesToMonitor.includes(addressType.type),
					hide: !isDeveloperMode,
					useCheckmark: true,
					onPress: async (): Promise<void> => {
						const needsToBeAdded = !addressTypesToMonitor.includes(
							addressType.type,
						);
						let newAddressTypesToMonitor: EAddressType[] = [];
						if (needsToBeAdded) {
							newAddressTypesToMonitor = [
								...addressTypesToMonitor,
								addressType.type,
							];
						} else {
							newAddressTypesToMonitor = addressTypesToMonitor.filter(
								(type) => type !== addressType.type,
							);
						}
						dispatch(
							updateWallet({
								addressTypesToMonitor: newAddressTypesToMonitor,
							}),
						);
						if (!hasShownMonitorNotification) {
							showToast({
								type: 'success',
								title: t('adv.monitored_address_types_update_title'),
								description: t(
									'adv.monitored_address_types_update_description',
								),
							});
							setHasShownMonitorNotification(true);
						}
					},
					testID: `Monitor${addressType.type}`,
				})),
			};
			data.push(monitoredTypes);
		}
		return data;
	}, [
		t,
		availableAddressTypes,
		isDeveloperMode,
		selectedAddressType,
		navigation,
		addressTypesToMonitor,
		hasShownMonitorNotification,
	]);

	return <SettingsView title={t('adv.address_type')} listData={listData} />;
};

export default memo(AddressTypeSettings);
