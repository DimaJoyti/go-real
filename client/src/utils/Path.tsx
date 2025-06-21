import React from 'react';
import { PiCaretRightLight } from 'react-icons/pi';
import { Link, useLocation } from 'react-router-dom';

interface PathObject {
    name: string;
    link: string;
}

const Path: React.FC = () => {

    const { pathname } = useLocation()
    const pathArr = pathname.split('/').filter(item => item !== ''); // Remove empty elements

    const pathObjects: PathObject[] = pathArr.map((item, index) => {
        const name = item;
        const link = `/${pathArr.slice(0, index + 1).join('/')}`;
        return { name, link };
    });

    pathObjects.unshift({ name: 'Dashboard', link: '/' });

    return (
        <div className='flex justify-start items-center gap-[2px] '>
            {
                pathObjects.map((path, index) => (
                    <React.Fragment key={index} >
                        <Link to={path.link} className='capitalize hover:text-primary-blue ' >{path.name}</Link>
                        {index !== pathObjects.length - 1 && <PiCaretRightLight className='text-primary-gray ' />}
                    </React.Fragment>
                ))
            }
        </div>
    )
}

export default Path