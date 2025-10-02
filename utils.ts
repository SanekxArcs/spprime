
import { Room, Role, Participant, Averages, VOTING_ROLES } from './types';

export function calculateAverages(room: Room): Averages {
  const roleVotes: { [key in Role]?: number[] } = {};
  let allVotes: number[] = [];

  room.participants.forEach((p: Participant) => {
    if (p.vote !== null && VOTING_ROLES.includes(p.role)) {
      if (!roleVotes[p.role]) {
        roleVotes[p.role] = [];
      }
      roleVotes[p.role]!.push(p.vote);
      allVotes.push(p.vote);
    }
  });

  const averages: Averages = { teamAverage: 0 };

  VOTING_ROLES.forEach(role => {
    const votes = roleVotes[role] || [];
    const multiplier = (room.multipliers[role] || 100) / 100;
    if (votes.length > 0) {
      const sum = votes.reduce((a, b) => a + b, 0);
      const avg = sum / votes.length;
      averages[role] = (avg * multiplier).toFixed(2);
    } else {
      averages[role] = 'N/A';
    }
  });

  if (allVotes.length > 0) {
      const totalWeightedSum = VOTING_ROLES.reduce((acc, role) => {
          const roleAvg = averages[role];
          const participantCount = room.participants.filter(p => p.role === role && p.vote !== null).length;
          if (typeof roleAvg === 'string' && roleAvg !== 'N/A') {
              return acc + (parseFloat(roleAvg) * participantCount);
          }
          return acc;
      }, 0);
      
      const totalVotingParticipants = room.participants.filter(p => p.vote !== null && VOTING_ROLES.includes(p.role)).length;
      
      if (totalVotingParticipants > 0) {
          averages.teamAverage = (totalWeightedSum / totalVotingParticipants).toFixed(2);
      } else {
          averages.teamAverage = 'N/A';
      }

  } else {
    averages.teamAverage = 'N/A';
  }

  return averages;
}
