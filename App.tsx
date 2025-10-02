
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { RoomPage } from './components/RoomPage';
import { Room } from './types';

const STORAGE_KEY = 'scrum_poker_rooms';

function App() {
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const savedRooms = localStorage.getItem(STORAGE_KEY);
      return savedRooms ? JSON.parse(savedRooms) : [];
    } catch (error) {
      console.error("Failed to parse rooms from localStorage", error);
      return [];
    }
  });
  
  const updateRooms = useCallback((newRooms: Room[] | ((prevRooms: Room[]) => Room[])) => {
    const updatedRooms = typeof newRooms === 'function' ? newRooms(rooms) : newRooms;
    setRooms(updatedRooms);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRooms));
  }, [rooms]);


  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
            setRooms(JSON.parse(event.newValue));
        } catch(e) {
            console.error("Failed to parse rooms from storage event", e)
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-3xl font-bold text-center text-purple-400 tracking-wider">
          Scrum Poker Prime
        </h1>
      </header>
      <main className="p-4 md:p-8">
        <HashRouter>
          <Routes>
            <Route path="/" element={<HomePage rooms={rooms} setRooms={updateRooms} />} />
            <Route path="/room/:roomId" element={<RoomPage rooms={rooms} setRooms={updateRooms} />} />
          </Routes>
        </HashRouter>
      </main>
    </div>
  );
}

export default App;
