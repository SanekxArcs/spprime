import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Room, Participant, Role, RoomState, Averages, VOTING_ROLES, Multipliers, Card } from '../types';
import {
  Card as UICard,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from './ui';
import { Button } from './ui';
import { Input } from './ui';
import { Label } from './ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui';
import { calculateAverages } from '../utils';
import { ManageCardsDialog } from './ManageCardsDialog';


interface RoomPageProps {
  rooms: Room[];
  setRooms: (rooms: Room[] | ((prevRooms: Room[]) => Room[])) => void;
}

// A simple user icon component
const UserIcon = () => (
    <svg xmlns="http://www.w.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export const RoomPage: React.FC<RoomPageProps> = ({ rooms, setRooms }) => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<{ userId: string; roomId: string } | null>(null);
    const [room, setRoom] = useState<Room | null>(null);
    const [participant, setParticipant] = useState<Participant | null>(null);
    const [averages, setAverages] = useState<Averages | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showManageCards, setShowManageCards] = useState(false);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('scrum_poker_user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.roomId === roomId) {
                setCurrentUser(parsedUser);
            } else {
                navigate('/');
            }
        } else {
            navigate('/');
        }
    }, [roomId, navigate]);

    useEffect(() => {
        const currentRoom = rooms.find(r => r.id === roomId);
        if (currentRoom) {
            setRoom(currentRoom);
            if (currentUser) {
                const currentParticipant = currentRoom.participants.find(p => p.id === currentUser.userId);
                if (currentParticipant) {
                    setParticipant(currentParticipant);
                } else {
                    sessionStorage.removeItem('scrum_poker_user');
                    navigate('/');
                    return;
                }
            }
            if (currentRoom.state === RoomState.Revealed) {
                setAverages(calculateAverages(currentRoom));
            } else {
                setAverages(null);
            }
        } else {
            if (currentUser) sessionStorage.removeItem('scrum_poker_user');
            navigate('/');
        }
    }, [rooms, roomId, currentUser, navigate]);
    
    const updateRoom = (updatedRoom: Room) => {
        setRooms(prevRooms => prevRooms.map(r => r.id === roomId ? updatedRoom : r));
    };

    const handleVote = (value: number) => {
        if (!room || !participant || !VOTING_ROLES.includes(participant.role)) return;

        const updatedParticipants = room.participants.map(p =>
            p.id === participant.id ? { ...p, vote: value } : p
        );
        updateRoom({ ...room, participants: updatedParticipants });
    };

    const handleReveal = () => {
        if (room && participant?.role === Role.PM) {
            updateRoom({ ...room, state: RoomState.Revealed });
        }
    };
    
    const handleNewRound = () => {
        if (room && participant?.role === Role.PM) {
            const resetParticipants = room.participants.map(p => ({ ...p, vote: null }));
            updateRoom({ ...room, state: RoomState.Voting, participants: resetParticipants });
        }
    };

    const handleLeaveRoom = () => {
        if (room && currentUser) {
            const updatedParticipants = room.participants.filter(p => p.id !== currentUser.userId);
            if (updatedParticipants.length === 0) {
                setRooms(prev => prev.filter(r => r.id !== room.id));
            } else {
                updateRoom({ ...room, participants: updatedParticipants });
            }
            sessionStorage.removeItem('scrum_poker_user');
            navigate('/');
        }
    };

    const handleKickParticipant = (participantId: string) => {
        if (room && participant?.role === Role.PM && participant.id !== participantId) {
            const updatedParticipants = room.participants.filter(p => p.id !== participantId);
            updateRoom({ ...room, participants: updatedParticipants });
        }
    };

    const handleMultiplierChange = (role: Role, value: string) => {
        if (room && participant?.role === Role.PM) {
            if (!VOTING_ROLES.includes(role)) return;
            const newMultiplier = parseInt(value, 10);
            if (!isNaN(newMultiplier) && newMultiplier >= 0) {
                const newMultipliers = { ...room.multipliers, [role as keyof Multipliers]: newMultiplier };
                updateRoom({ ...room, multipliers: newMultipliers });
            }
        }
    };
    
    const handleSaveCards = (newCards: Card[]) => {
        if (room && participant?.role === Role.PM) {
            updateRoom({ ...room, cards: newCards });
            setShowManageCards(false);
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}${window.location.pathname}#/room/${roomId}`;
        navigator.clipboard.writeText(url).then(() => {
            alert("Room link copied to clipboard!");
        }, () => {
            alert("Failed to copy link.");
        });
    };

    if (!room || !participant) {
        return <div className="text-center p-8">Loading room...</div>;
    }

    const isPM = participant.role === Role.PM;
    const canVote = VOTING_ROLES.includes(participant.role);
    const votingMembers = room.participants.filter(p => VOTING_ROLES.includes(p.role));
    const votingComplete = votingMembers.length > 0 && votingMembers.every(p => p.vote !== null);


    return (
        <div className="container mx-auto max-w-7xl">
            <UICard className="bg-gray-800 border-gray-700 mb-8">
                <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div>
                        <CardTitle className="text-3xl text-purple-400">{room.name}</CardTitle>
                        <CardDescription className="text-gray-400 pt-2">Welcome, {participant.name} ({participant.role})</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                        {isPM && <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">Settings</Button>}
                        <Button onClick={copyLink} variant="secondary" size="sm">Copy Invite Link</Button>
                        <Button onClick={handleLeaveRoom} variant="destructive" size="sm">Leave Room</Button>
                    </div>
                </CardHeader>
            </UICard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-300">Participants ({room.participants.length})</h2>
                    <UICard className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4 space-y-3">
                            {room.participants.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <UserIcon />
                                        <div>
                                            <p className="font-semibold">{p.name} {p.id === participant.id && '(You)'}</p>
                                            <p className="text-sm text-gray-400">{p.role}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {room.state === RoomState.Voting && VOTING_ROLES.includes(p.role) && (
                                            <div className={`w-6 h-6 rounded-full ${p.vote !== null ? 'bg-green-500' : 'bg-gray-500'}`} title={p.vote !== null ? 'Voted' : 'Waiting to vote'}></div>
                                        )}
                                        {room.state === RoomState.Revealed && VOTING_ROLES.includes(p.role) && (
                                            <span className="text-lg font-bold px-3 py-1 bg-purple-600 rounded-md">{room.cards.find(c => c.value === p.vote)?.display ?? p.vote ?? '-'}</span>
                                        )}
                                         {isPM && p.id !== participant.id && (
                                            <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleKickParticipant(p.id)} title={`Remove ${p.name}`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </UICard>
                </div>
                
                <div className="lg:col-span-2 space-y-8">
                    {room.state === RoomState.Voting ? (
                        <div>
                            <h2 className="text-2xl font-bold text-gray-300 mb-4">{canVote ? "Choose your card" : "Waiting for team to vote..."}</h2>
                             {votingComplete && <p className="text-green-400 mb-4">All votes are in! The PM can now reveal the results.</p>}
                             {canVote && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {room.cards.map(card => (
                                        <button 
                                            key={card.value}
                                            onClick={() => handleVote(card.value)}
                                            disabled={!canVote}
                                            className={`aspect-square flex items-center justify-center text-3xl font-bold rounded-lg transition-all duration-200
                                                ${participant.vote === card.value ? 'bg-purple-600 ring-2 ring-purple-300 transform -translate-y-2' : 'bg-gray-700 hover:bg-purple-800'}
                                                ${!canVote ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            {card.display}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                             <h2 className="text-2xl font-bold text-gray-300 mb-4">Results</h2>
                             <UICard className="bg-gray-800 border-gray-700">
                                <CardContent className="p-6">
                                    {averages && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                            <div>
                                                <p className="text-sm text-gray-400">Team Average</p>
                                                <p className="text-3xl font-bold">{averages.teamAverage}</p>
                                            </div>
                                            {VOTING_ROLES.map(role => (
                                                <div key={role}>
                                                    <p className="text-sm text-gray-400">{role} Avg</p>
                                                    <p className="text-3xl font-bold">{averages[role]}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                             </UICard>
                        </div>
                    )}
                    
                    {isPM && (
                        <UICard className="bg-gray-800 border-gray-700 mt-8">
                            <CardHeader>
                                <CardTitle>PM Controls</CardTitle>
                            </CardHeader>
                            <CardContent className="flex space-x-4">
                                {room.state === RoomState.Voting ? (
                                    <Button onClick={handleReveal} disabled={!votingComplete} className="flex-1">
                                        Reveal Votes { !votingComplete && `(Waiting for ${votingMembers.filter(p => p.vote === null).length})`}
                                    </Button>
                                ) : (
                                    <Button onClick={handleNewRound} className="flex-1">Start New Round</Button>
                                )}
                            </CardContent>
                        </UICard>
                    )}
                </div>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                    <DialogHeader>
                        <DialogTitle>Room Settings</DialogTitle>
                        <DialogDescription>Adjust multipliers for role-based estimates.</DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <h3 className="font-semibold">Role Multipliers (%)</h3>
                        {VOTING_ROLES.map(role => (
                           <div key={role} className="flex items-center justify-between">
                                <Label htmlFor={`multiplier-${role}`}>{role}</Label>
                                <Input 
                                    id={`multiplier-${role}`}
                                    type="number"
                                    value={room.multipliers[role as keyof Multipliers]}
                                    onChange={e => handleMultiplierChange(role, e.target.value)}
                                    className="w-24 bg-gray-900 border-gray-600"
                                />
                            </div>
                        ))}
                    </div>
                    <DialogFooter className="justify-between">
                        <Button variant="outline" onClick={() => { setShowSettings(false); setShowManageCards(true); }}>Manage Cards</Button>
                        <Button onClick={() => setShowSettings(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ManageCardsDialog 
                isOpen={showManageCards}
                onClose={() => setShowManageCards(false)}
                currentCards={room.cards}
                onSave={handleSaveCards}
            />
        </div>
    );
};
