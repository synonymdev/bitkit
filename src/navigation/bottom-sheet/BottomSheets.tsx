import React, { memo } from 'react';
import { useAppSelector } from '../../hooks/redux';
import { viewControllersSelector } from '../../store/reselect/ui';
// import TransferFailed from '../bottom-sheet/TransferFailed';

import BackupNavigation from './BackupNavigation';
import BoostPrompt from '../../screens/Wallets/BoostPrompt';
import ConnectionClosed from './ConnectionClosed';
import ForceTransfer from './ForceTransfer';
import LNURLPayNavigation from './LNURLPayNavigation';
import LNURLWithdrawNavigation from './LNURLWithdrawNavigation';
import NewTxPrompt from '../../screens/Wallets/NewTxPrompt';
import OrangeTicket from '../../screens/OrangeTicket';
import PINNavigation from './PINNavigation';
import ReceiveNavigation from './ReceiveNavigation';
import SendNavigation from './SendNavigation';
import TreasureHuntNavigation from './TreasureHuntNavigation';

const BottomSheets = (): JSX.Element => {
	const views = useAppSelector(viewControllersSelector);

	return (
		<>
			{views.backupNavigation.isMounted && <BackupNavigation />}
			{views.boostPrompt.isMounted && <BoostPrompt />}
			{views.connectionClosed.isMounted && <ConnectionClosed />}
			{views.forceTransfer.isMounted && <ForceTransfer />}
			{views.lnurlPay.isMounted && <LNURLPayNavigation />}
			{views.lnurlWithdraw.isMounted && <LNURLWithdrawNavigation />}
			{views.newTxPrompt.isMounted && <NewTxPrompt />}
			{views.orangeTicket.isMounted && <OrangeTicket />}
			{views.PINNavigation.isMounted && <PINNavigation />}
			{views.receiveNavigation.isMounted && <ReceiveNavigation />}
			{views.sendNavigation.isMounted && <SendNavigation />}
			{views.treasureHunt.isMounted && <TreasureHuntNavigation />}
		</>
	);
};

export default memo(BottomSheets);
