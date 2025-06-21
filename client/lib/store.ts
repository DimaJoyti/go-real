'use client'

import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

// Import existing reducers
import approvalReducer from './redux/reducer/approval'
import cashbookReducer from './redux/reducer/cashbook'
import deductionReducer from './redux/reducer/deduction'
import eventReducer from './redux/reducer/event'
import followUpReducer from './redux/reducer/followUp'
import inventoryReducer from './redux/reducer/inventory'
import leadReducer from './redux/reducer/lead'
import notificationReducer from './redux/reducer/notification'
import projectReducer from './redux/reducer/project'
import refundReducer from './redux/reducer/refund'
import saleReducer from './redux/reducer/sale'
import societyReducer from './redux/reducer/society'
import taskReducer from './redux/reducer/task'
import transcriptReducer from './redux/reducer/transcript'
import uploadReducer from './redux/reducer/upload'
import userReducer from './redux/reducer/user'
import voucherReducer from './redux/reducer/voucher'

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
