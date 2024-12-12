import { dispatch } from '../helpers';
import { updateUser } from '../slices/user';
import { isGeoBlocked } from '../../utils/blocktank';

export const setGeoBlock = async (): Promise<boolean> => {
	const isBlocked = await isGeoBlocked();
	dispatch(updateUser({ isGeoBlocked: isBlocked }));
	return isBlocked;
};
