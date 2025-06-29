import { Alarm, Archive, LinkOutlined, Message, Person } from '@mui/icons-material';
import { Avatar, Tooltip } from '@mui/material';
import { Draggable } from 'react-beautiful-dnd';
import { Check2Square } from 'react-bootstrap-icons';
import { useDispatch } from 'react-redux';
import { format } from 'timeago.js';
import { person1 } from '../../../assets';
import { rootURL } from '../../../constants';
import { updateLead } from '../../../redux/action/lead';


const Lead = ({ lead, index, }) => {
  const dispatch = useDispatch()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${rootURL}/leads/${lead?._id}`);
  }
  const handleArchive = () => {
    dispatch(updateLead(lead._id, { isArchived: true }, { loading: false }))
  }
  const handleUnArchive = () => {
    dispatch(updateLead(lead._id, { isArchived: false }, { loading: false }))
  }


  return (
    <Draggable draggableId={lead?._id} key={lead?._id} index={index}  >
      {(provided, snapshot) => (
        <div
          {...provided.dragHandleProps}
          {...provided.draggableProps}
          ref={provided.innerRef}
          isDragging={snapshot.isDragging}
          className={` flex flex-col gap-[8px] bg-white rounded-[4px] p-[6px] ${snapshot.isDragging ? 'opacity-[80] ' : ' '}  `}
        >

          <div className="flex flex-col gap-[6px] ">
            <h4 className='text-[13px] text-primary-gray ' >{lead?.title}</h4>
            <span className='w-fit text-[10px] text-primary-gray bg-secondary-gray px-[6px] py-[2px] rounded-[2px] '>{lead?.contact}</span>
            <span className='w-fit text-[10px] text-primary-blue bg-secondary-blue px-[6px] py-[2px] rounded-[2px] ' >{lead?.value}</span>
            <div className="text-[11px] flex flex-col gap-[4px] ">
              <div className="flex justify-start items-center gap-[8px]  ">
                <span className='text-primary-gray ' >Telephone:</span>
                <span className='text-gray-400 ' >{lead?.clientId?.phone || '---'}</span>
              </div>
              <div className="flex justify-start items-center gap-[8px]  ">
                <span className='text-primary-gray ' >Created:</span>
                <span className='text-gray-400 ' >{format(lead?.createdAt) || '---'}</span>
              </div>
              <div className="flex justify-start items-center gap-[8px]  ">
                <span className='text-primary-gray ' >Contacted:</span>
                <span className='text-gray-400 ' >{lead?.clientId?.email || '---'}</span>
              </div>
              <div className="flex justify-start items-center gap-[8px]  ">
                <span className='text-primary-gray ' >Email:</span>
                <span className='text-gray-400 ' >{lead?.clientId?.email || '---'}</span>
              </div>
              <div className="flex justify-start items-center gap-[8px]  ">
                <span className='text-primary-gray ' >Priority:</span>
                <span className='text-gray-400 capitalize ' >{lead?.priority || '---'}</span>
              </div>
              <div className="flex justify-start items-center gap-[8px]  ">
                <span className='text-primary-gray ' >Target Date:</span>
                <span className='text-gray-400 ' >{lead?.targetDate || '---'}</span>
              </div>
            </div>
          </div>

          {/* alert */}
          <div className="flex flex-col gap-[4px] bg-red-100 p-[10px] rounded-[8px] ">
            <div className="flex justify-start items-center gap-[12px] ">
              <div className="h-full flex items-start ">
                <Alarm className='text-red-700 ' />
              </div>
              <div className="flex flex-col text-red-700">
                <span className='text-[14px] font-[400] ' >{lead?.alarm?.time}</span>
                <span className='text-[12px] font-light ' >{lead?.alarm?.date}</span>
              </div>
            </div>
            <button className='text-red-700 bg-red-200 text-[11px] py-[4px] w-full rounded-[2px] ' >{lead?.alarm?.CTA}</button>
          </div>

          <div className="flex justify-between items-center ">
            <div className="flex justify-start items-center gap-[8px] ">
              <Tooltip placement='top' title='You created this lead' >
                <Person style={{ fontSize: '18px' }} className='cursor-pointer rounded-full p-[2px] bg-blue-500 text-white ' />
              </Tooltip>
              <Tooltip placement='top' title={lead?.isArchived ? 'Un Archive' : 'Archive'} >
                <Archive onClick={() => lead.isArchived ? handleUnArchive() : handleArchive()} style={{ fontSize: '18px' }} className='cursor-pointer rounded-full ' />
              </Tooltip>
              <Tooltip placement='top' title='URL' >
                <LinkOutlined onClick={handleCopyLink} style={{ fontSize: '18px' }} className='cursor-pointer rounded-full ' />
              </Tooltip>
              <Tooltip placement='top' title='Message' >
                <Message style={{ fontSize: '18px' }} className='cursor-pointer rounded-full ' />
              </Tooltip>
              <Tooltip placement='top' title='Check' >
                <Check2Square style={{ fontSize: '18px' }} className='cursor-pointer rounded-full ' />
              </Tooltip>
            </div>

            <div className="">
              <Avatar src={person1} style={{ width: '2rem', height: '2rem' }} className=' ' />
            </div>
          </div>


          {provided.placeholder}




        </div>
      )}
    </Draggable>
  );
};

export default Lead;
