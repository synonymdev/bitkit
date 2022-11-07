import React, {
	memo,
	ReactElement,
	useCallback,
	useMemo,
	useState,
} from 'react';

import { IListData } from '../../../components/List';
import SettingsView from '../SettingsView';
import { getSelectedAddressType, refreshWallet } from '../../../utils/wallet';
import { capitalize } from '../../../utils/helpers';
import { updateSelectedAddressType } from '../../../store/actions/wallet';
import { TAddressType } from '../../../store/types/wallet';
import { updateSettings } from '../../../store/actions/settings';
import { useAppSelector } from '../../../hooks/redux';
import type { SettingsScreenProps } from '../../../navigation/types';

const typesDescriptions = {
	p2wpkh: {
		description: 'Pay-to-witness-public-key-hash',
		example: '(bc1x...)',
	},
	p2sh: { description: 'Pay-to-Script-Hash', example: '(3x...)' },
	p2pkh: { description: 'Pay-to-public-key-hash', example: '(1x...)' },
};

const AddressTypeSettings = ({
	navigation,
}: SettingsScreenProps<'AddressTypePreference'>): ReactElement => {
	const [addressTypeState, setAddressTypeState] = useState<TAddressType>('');
	const addressTypes = useAppSelector((state) => state.wallet.addressTypes);
	const selectedWallet = useAppSelector((state) => state.wallet.selectedWallet);
	const selectedNetwork = useAppSelector(
		(state) => state.wallet.selectedNetwork,
	);

	const addressTypesList = useMemo(() => {
		return Object.values(addressTypes).map(({ label, type }) => {
			return { label: capitalize(label), value: type };
		});
	}, [addressTypes]);

	const selectedAddressType = useMemo(
		(): string =>
			getSelectedAddressType({
				selectedWallet,
				selectedNetwork,
			}),
		[selectedNetwork, selectedWallet],
	);

	const setAddressTypePreference = (preference: TAddressType): void => {
		setAddressTypeState(preference);
		updateSelectedAddressType({ addressType: preference });
		refreshWallet({}).then();
	};

	const checkAddressTypeListCheckmark = useCallback(
		(type: TAddressType): boolean => {
			if (selectedAddressType === addressTypeState) {
				return addressTypeState === type;
			}
			if (addressTypeState === '') {
				return selectedAddressType === type;
			}
			return addressTypeState === type;
		},
		[selectedAddressType, addressTypeState],
	);

	const AddressTypeListData: IListData[] = useMemo(
		() => [
			{
				title: 'Bitcoin address type',
				data: addressTypesList.map((bitcoinUnit) => ({
					type: 'button',
					value: checkAddressTypeListCheckmark(bitcoinUnit.value),
					description: typesDescriptions[bitcoinUnit.value].description,
					title: `${bitcoinUnit.label} ${
						typesDescriptions[bitcoinUnit.value].example
					}`,
					useCheckmark: true,
					onPress: async (): Promise<void> => {
						navigation.goBack();
						updateSettings({ addressType: bitcoinUnit.value });
						setAddressTypePreference(bitcoinUnit.value);
						await refreshWallet({ lightning: false, onchain: true });
					},
				})),
			},
		],
		[addressTypesList, checkAddressTypeListCheckmark, navigation],
	);

	return (
		<SettingsView
			title="Bitcoin Address Type"
			listData={AddressTypeListData}
			showBackNavigation
		/>
	);
};

export default memo(AddressTypeSettings);
