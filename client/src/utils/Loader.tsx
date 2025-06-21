import React from 'react'
import { ThreeDots } from 'react-loader-spinner'

const Loader: React.FC = () => {
    return (
        <ThreeDots
            height="80"
            width="80"
            radius="9"
            color="gray"
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
        />
    )
}

export default Loader