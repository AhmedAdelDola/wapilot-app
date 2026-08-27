import type { RootState } from '@/viewmodels/store';
import { macroAdapter } from './macroSlice';

export const selectMacrosState = (state: RootState) => state.macros;

export const { selectAll: selectAllMacros } = macroAdapter.getSelectors(selectMacrosState);
