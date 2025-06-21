import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { rootURL } from "../../constants";

// Types
export interface UploadState {
    url: string | null;
    urls: string[];
    isFetching: boolean;
    error: string | null;
}

export interface UploadImagePayload {
    result: string;
    isMultiple: boolean;
}

export interface DeleteImagePayload {
    filename: string;
    isMultiple: boolean;
}

const uploadSlice = createSlice({
    name: 'upload',
    initialState: {
        url: null,
        urls: [],
        isFetching: false,
        error: null
    } as UploadState,
    reducers: {
        start: (state: UploadState) => { state.isFetching = true; state.error = null },
        end: (state: UploadState) => { state.isFetching = false },
        error: (state: UploadState, action: PayloadAction<string>) => { state.isFetching = false; state.error = action.payload },

        setUrlsReducer: (state: UploadState, action: PayloadAction<string[]>) => {
            state.urls = action.payload
        },
        setUrlReducer: (state: UploadState, action: PayloadAction<string[]>) => {
            state.urls = action.payload
        },

        uploadImageReducer: (state: UploadState, action: PayloadAction<UploadImagePayload>) => {
            const { result, isMultiple } = action.payload
            isMultiple
                ?
                state.urls = [`${rootURL}${result}`, ...state.urls]
                :
                state.url = `${rootURL}${result}`
        },
        deleteImageReducer: (state: UploadState, action: PayloadAction<DeleteImagePayload>) => {
            const { filename, isMultiple } = action.payload
            isMultiple
                ?
                state.urls = state.urls.filter(url => url !== `${rootURL}/uploads/${filename}`)
                :
                state.url = null
        },
        deleteAllImagesReducer: (state: UploadState) => {
            state.urls = []
        }
    }
})

export const {
    start,
    end,
    error,
    setUrlReducer,
    setUrlsReducer,
    uploadImageReducer,
    deleteImageReducer,

    deleteAllImagesReducer,

} = uploadSlice.actions
export default uploadSlice.reducer