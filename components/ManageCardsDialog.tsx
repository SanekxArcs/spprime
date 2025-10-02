import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui';
import { Button } from './ui';
import { Input } from './ui';
import { Label } from './ui';

interface ManageCardsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    currentCards: Card[];
    onSave: (newCards: Card[]) => void;
}

export const ManageCardsDialog: React.FC<ManageCardsDialogProps> = ({ isOpen, onClose, currentCards, onSave }) => {
    const [cardsStr, setCardsStr] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Format is "display:value", e.g., "☕️:100"
            const str = currentCards.map(c => c.display === String(c.value) ? c.value : `${c.display}:${c.value}`).join(', ');
            setCardsStr(str);
            setError('');
        }
    }, [isOpen, currentCards]);

    const handleSave = () => {
        setError('');
        const parts = cardsStr.split(',').map(p => p.trim()).filter(p => p);
        const newCards: Card[] = [];

        for (const part of parts) {
            const split = part.split(':');
            if (split.length === 1) {
                // Just a number, e.g., "5"
                const value = parseFloat(split[0]);
                if (isNaN(value)) {
                    setError(`Invalid number format: "${split[0]}"`);
                    return;
                }
                newCards.push({ value, display: String(value) });
            } else if (split.length === 2) {
                // display:value, e.g., "XL:20"
                const display = split[0].trim();
                const value = parseFloat(split[1]);
                 if (isNaN(value)) {
                    setError(`Invalid number format for "${display}": "${split[1]}"`);
                    return;
                }
                if (!display) {
                    setError(`Display text cannot be empty for value: ${value}`);
                    return;
                }
                newCards.push({ value, display });
            } else {
                 setError(`Invalid format: "${part}". Use "value" or "display:value".`);
                 return;
            }
        }
        
        // Check for duplicate values
        const values = new Set();
        for (const card of newCards) {
            if (values.has(card.value)) {
                setError(`Duplicate value found: ${card.value}. Each card must have a unique numeric value.`);
                return;
            }
            values.add(card.value);
        }

        // Sort cards by value
        newCards.sort((a, b) => a.value - b.value);
        
        onSave(newCards);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
                <DialogHeader>
                    <DialogTitle>Manage Voting Cards</DialogTitle>
                    <DialogDescription>
                        Enter card values as a comma-separated list. Use "display:value" for custom labels (e.g., XS:1, S:2, ☕️:100).
                    </DialogDescription>
                </DialogHeader>
                <div className="p-6 space-y-4">
                    <Label htmlFor="cards-input">Card Deck</Label>
                    <Input
                        id="cards-input"
                        value={cardsStr}
                        onChange={(e) => setCardsStr(e.target.value)}
                        className="bg-gray-900 border-gray-600"
                        placeholder="0, 1, 2, 3, 5, 8, Coffee:100"
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Cards</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
