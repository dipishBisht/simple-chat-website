import { useSocket } from "../context/SocketContext"

export default function HomePage(){

    const { isConnected, rooms, totalRooms}= useSocket();

    console.log(isConnected, rooms, totalRooms);
    return (
        <div>
            {
                rooms.length?
                <>
                </>
                :
                <>
                No Room Exist

                <button className="bg-">Create Room</button>
                </>
            }
        </div>
    )
}