'use client'

import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

// Import existing reducers
import approvalReducer from '../src/redux/reducer/approval'
import cashbookReducer from '../src/redux/reducer/cashbook'
import deductionReducer from '../src/redux/reducer/deduction'
import eventReducer from '../src/redux/reducer/event'
import followUpReducer from '../src/redux/reducer/followUp'
import inventoryReducer from '../src/redux/reducer/inventory'
import leadReducer from '../src/redux/reducer/lead'
import notificationReducer from '../src/redux/reducer/notification'
import projectReducer from '../src/redux/reducer/project'
import refundReducer from '../src/redux/reducer/refund'
import saleReducer from '../src/redux/reducer/sale'
import societyReducer from '../src/redux/reducer/society'
import taskReducer from '../src/redux/reducer/task'
import transcriptReducer from '../src/redux/reducer/transcript'
import uploadReducer from '../src/redux/reducer/upload'
import userReducer from '../src/redux/reducer/user'
import voucherReducer from '../src/redux/reducer/voucher'

const rootReducer = combineReducers({
  upload: uploadReducer,
  approval: approvalReducer,
  event: eventReducer,
  notification: notificationReducer,
  user: userReducer,
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
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['user'], // Only persist user state
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
