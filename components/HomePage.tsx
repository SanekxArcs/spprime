import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Room, Role, RoomState, Card as CardType } from '../types';
import { Card as UICard, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from './ui';
import { Button } from './ui';
import { Input } from './ui';
import { Label } from './ui';
import { Select } from './ui';

interface HomePageProps {
  rooms: Room[];
  setRooms: (rooms: Room[] | ((prevRooms: Room[]) => Room[])) => void;
}

const DEFAULT_CARDS: CardType[] = [
    { value: 0, display: '0' },
    { value: 1, display: '1' },
    { value: 2, display: '2' },
    { value: 3, display: '3' },
    { value: 5, display: '5' },
    { value: 8, display: '8' },
    { value: 13, display: '13' },
    { value: 21, display: '21' },
    { value: 34, display: '34' },
    { value: 55, display: '55' },
    { value: 89, display: '89' },
];

export const HomePage: React.FC<HomePageProps> = ({ rooms, setRooms }) => {
  const navigate = useNavigate();
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');

  // Create Room State
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [pmName, setPmName] = useState('');

  // Join Room State
  const [joinName, setJoinName] = useState('');
  const [joinRole, setJoinRole] = useState<Role>(Role.Frontend);
  const [joinPassword, setJoinPassword] = useState('');

  const handleCreateRoom = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!roomName.trim() || !pmName.trim()) {
      setError('Room Name and Your Name are required.');
      return;
    }
    const pmId = crypto.randomUUID();
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: roomName,
      password: roomPassword,
      state: RoomState.Voting,
      participants: [{ id: pmId, name: pmName, role: Role.PM, vote: null }],
      cards: DEFAULT_CARDS,
      multipliers: {
        [Role.Frontend]: 100,
        [Role.Backend]: 100,
        [Role.QA]: 100,
      }
    };
    
    sessionStorage.setItem('scrum_poker_user', JSON.stringify({ userId: pmId, roomId: newRoom.id }));
    setRooms(prev => [...prev, newRoom]);
    
    // Defer navigation to allow state to propagate
    setTimeout(() => {
        navigate(`/room/${newRoom.id}`);
    }, 0);
  };

  const handleJoinRoom = (e: FormEvent, roomToJoin: Room) => {
    e.preventDefault();
    setJoinError('');

    if (!joinName.trim()) {
      setJoinError('Your Name cannot be empty.');
      return;
    }
    if (roomToJoin.password && roomToJoin.password !== joinPassword) {
      setJoinError('Incorrect password.');
      return;
    }

    const newUserId = crypto.randomUUID();
    let joinErrorMsg = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomToJoin.id) {
        if (r.participants.some(p => p.name.toLowerCase() === joinName.toLowerCase())) {
          joinErrorMsg = 'A user with this name is already in the room.';
          return r;
        }
        return {
          ...r,
          participants: [...r.participants, { id: newUserId, name: joinName, role: joinRole, vote: null }]
        };
      }
      return r;
    });

    if (joinErrorMsg) {
      setJoinError(joinErrorMsg);
      return;
    }

    setRooms(updatedRooms);
    sessionStorage.setItem('scrum_poker_user', JSON.stringify({ userId: newUserId, roomId: roomToJoin.id }));
    
    // Defer navigation to allow state to propagate
    setTimeout(() => {
      navigate(`/room/${roomToJoin.id}`);
    }, 0);
  };

  const handleSelectRoom = (roomId: string) => {
    if (selectedRoomId === roomId) {
        setSelectedRoomId(null);
    } else {
        setSelectedRoomId(roomId);
        setJoinError('');
        setJoinPassword('');
        setJoinName('');
        setJoinRole(Role.Frontend);
    }
  };
  
  const copyLink = (roomId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
        alert("Room link copied to clipboard!");
    }, () => {
        alert("Failed to copy link.");
    });
  };

  return (
    <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Create Room */}
        <div className="sticky top-8">
            <UICard className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-2xl text-purple-400">Welcome to Scrum Poker Prime!</CardTitle>
                    <CardDescription className="text-gray-400 pt-2">
                        Create a new room for your team or join an existing one to start estimating.
                    </CardDescription>
                </CardHeader>
                <form id="create-room-form" onSubmit={handleCreateRoom}>
                    <CardContent className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">Create a New Room</h3>
                        <div className="space-y-2">
                            <Label htmlFor="roomName">Room Name</Label>
                            <Input id="roomName" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="My Awesome Team" className="bg-gray-900 border-gray-600"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pmName">Your Name (as PM)</Label>
                            <Input id="pmName" value={pmName} onChange={e => setPmName(e.target.value)} placeholder="Project Manager" className="bg-gray-900 border-gray-600"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="roomPassword">Room Password (Optional)</Label>
                            <Input id="roomPassword" type="password" value={roomPassword} onChange={e => setRoomPassword(e.target.value)} placeholder="Leave blank for open room" className="bg-gray-900 border-gray-600"/>
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Create Room</Button>
                    </CardFooter>
                </form>
            </UICard>
        </div>

        {/* Right Column: Available Rooms */}
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-300">Available Rooms</h2>
             {rooms.length > 0 ? (
                rooms.map(room => (
                <UICard key={room.id} className="bg-gray-800 border-gray-700 transition-all duration-300">
                    <CardHeader className="flex flex-row justify-between items-center">
                        <div>
                            <CardTitle className="text-purple-400">{room.name}</CardTitle>
                            <CardDescription className="text-gray-500 pt-1">{room.password ? 'Password Protected' : 'Open Room'}</CardDescription>
                        </div>
                        <span className="text-gray-400 text-sm">{room.participants.length} participant(s)</span>
                    </CardHeader>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline" size="sm" onClick={() => copyLink(room.id)}>Copy Link</Button>
                        <Button size="sm" onClick={() => handleSelectRoom(room.id)}>
                            {selectedRoomId === room.id ? 'Close' : 'Join'}
                        </Button>
                    </CardFooter>

                    {selectedRoomId === room.id && (
                        <form onSubmit={(e) => handleJoinRoom(e, room)}>
                            <CardContent className="pt-4 border-t border-gray-700 space-y-4">
                                <h3 className="font-semibold text-gray-300">Join "{room.name}"</h3>
                                <div className="space-y-2">
                                    <Label htmlFor={`joinName-${room.id}`}>Your Name</Label>
                                    <Input id={`joinName-${room.id}`} value={joinName} onChange={e => setJoinName(e.target.value)} placeholder="Jane Doe" className="bg-gray-900 border-gray-600"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={`joinRole-${room.id}`}>Your Role</Label>
                                    <Select id={`joinRole-${room.id}`} value={joinRole} onChange={e => setJoinRole(e.target.value as Role)} className="bg-gray-900 border-gray-600">
                                    <option value={Role.Frontend}>Front-End</option>
                                    <option value={Role.Backend}>Back-End</option>
                                    <option value={Role.QA}>QA</option>
                                    </Select>
                                </div>
                                {room.password && (
                                    <div className="space-y-2">
                                        <Label htmlFor={`joinPassword-${room.id}`}>Room Password</Label>
                                        <Input id={`joinPassword-${room.id}`} type="password" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} className="bg-gray-900 border-gray-600"/>
                                    </div>
                                )}
                                {joinError && <p className="text-red-500 text-sm">{joinError}</p>}
                                <Button type="submit" className="w-full">Confirm & Join</Button>
                            </CardContent>
                        </form>
                    )}
                </UICard>
                ))
             ) : (
                <UICard className="bg-gray-800 border-gray-700 text-center">
                    <CardContent className="p-8">
                        <p className="text-gray-500">No rooms available. Create one to get started!</p>
                    </CardContent>
                </UICard>
             )}
        </div>
    </div>
  );
};