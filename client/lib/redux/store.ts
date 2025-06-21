import { combineReducers, configureStore } from '@reduxjs/toolkit';
import approvalReducer from './reducer/approval';
import cashbookReducer from './reducer/cashbook';
import deductionReducer from './reducer/deduction';
import eventReducer from './reducer/event';
import followUpReducer from './reducer/followUp';
import inventoryReducer from './reducer/inventory';
import leadReducer from './reducer/lead';
import notificationReducer from './reducer/notification';
import projectReducer from './reducer/project';
import refundReducer from './reducer/refund';
import saleReducer from './reducer/sale';
import societyReducer from './reducer/society';
import taskReducer from './reducer/task';
import transcriptReducer from './reducer/transcript';
import uploadReducer from './reducer/upload';
import userReducer from './reducer/user'; // Corrected import name
import voucherReducer from './reducer/voucher';

const rootReducer = combineReducers({
    upload: uploadReducer,
    approval: approvalReducer,
    event: eventReducer,
    notification: notificationReducer,
    user: userReducer, // Corrected reducer name
    task: taskReducer,
    sale: saleReducer,
    lead: leadReducer,
    followUp: followUpReducer,
    refund: refundReducer,
    society: societyReducer,
    project: projectReducer,
    inventory: inventoryReducer,
    cashbook: cashbookReducer,
    voucher: voucherReducer,
    deduction: deductionReducer,
    transcript: transcriptReducer,
});

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false })
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch