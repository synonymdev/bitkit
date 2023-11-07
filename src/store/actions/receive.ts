import { ok, Result } from '@synonymdev/result';
import { ICJitEntry } from '@synonymdev/blocktank-lsp-http-client';
import actions from './actions';
import { getDispatch } from '../helpers';

const dispatch = getDispatch();

export const updateInvoice = (payload: {
	amount?: number;
	numberPadText?: string;
	message?: string;
	tags?: string[];
	jitOrder?: ICJitEntry;
}): Result<string> => {
	dispatch({ type: actions.UPDATE_INVOICE, payload });
	return ok('');
};

export const resetInvoice = (): Result<string> => {
	dispatch({ type: actions.RESET_INVOICE });
	return ok('');
};

export const removeInvoiceTag = (payload: { tag: string }): Result<string> => {
	dispatch({ type: actions.DELETE_INVOICE_TAG, payload });
	return ok('');
};
