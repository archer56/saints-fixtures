// https://rugby-union-feeds.incrowdsports.com/v1/matches?provider=rugbyviz&season=202501&compId=1297&sort=date&form=true&images=true

import axios from "axios";
// @ts-ignore
import fs from 'fs';
import { RUFeedsMatch } from "./types/rugby-union-feeds.types";


const season = '202501'

const compId = {
  premiership: '1011',
  premiershipCup: '1297',
  championsCup: '1008',
  challengeCup: '1026',
}

const saintsId = 3436;

type Match = {
  homeMatch: {
    id: string;
  }
}

type SavedMatches = Record<string, {
  calCreated: string;
  updateIteration: number;
  startTime: string;
  endTime: string;
  competition: string;
  status: RUFeedsMatch['status'];
  homeTeam: string;
  homeScore: number | null;
  awayTeam: string;
  awayScore: number | null;
  broadcaster: string[] | null;
  location: string;
  lastModified?: string;
}>

const getSaintsGames = async (competitionId: string): Promise<RUFeedsMatch[]> => {
  const data = await axios.get('https://rugby-union-feeds.incrowdsports.com/v1/matches', {
    params: {
      provider: 'rugbyviz',
      season,
      compId: competitionId,
      sort:'date'
    }
  })
  
  // @ts-ignore
  const saintsMatches = data?.data?.data?.reduce((acc, currMatch) => {
    if(currMatch?.homeTeam?.id === saintsId || currMatch?.awayTeam?.id === saintsId) {
      acc.push(currMatch);
    }

    return acc;
  }, [])

  return saintsMatches;
} 


function formatDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

( async() => {
  const data = await Promise.all([
    getSaintsGames(compId.premiership),
    getSaintsGames(compId.premiershipCup),
    getSaintsGames(compId.championsCup),
    getSaintsGames(compId.challengeCup)
  ])

  // @ts-ignore
  const orderedMatches = data.flat().sort((a, b) => new Date(a.date) - new Date(b.date));

  const rugbyMatches = JSON.parse(fs.readFileSync('rugbymatches.json', 'utf8')) as SavedMatches;

  let updatesToCalendarNeeded = false;
  
  const rugbyMatchesUpdated = orderedMatches.reduce<SavedMatches>((acc, currMatch): SavedMatches => {
    if(!currMatch.id || !currMatch.date) {
      return acc;
    }

    const startTime = new Date(currMatch.date);

    if(acc?.[currMatch.id]) {
      const savedMatch = acc[currMatch.id];
      if(savedMatch.status !== currMatch.status || savedMatch.startTime !== currMatch.date) {
        updatesToCalendarNeeded = true;

        savedMatch.status = currMatch.status;
        savedMatch.homeScore = currMatch?.homeTeam?.score ?? null;
        savedMatch.awayScore = currMatch?.awayTeam?.score ?? null;
        savedMatch.updateIteration = savedMatch.updateIteration + 1
        savedMatch.lastModified = formatDate(new Date());
      }

      return acc;
    }
    
    updatesToCalendarNeeded = true;

    acc[currMatch.id] = {
      calCreated: formatDate(new Date()),
      updateIteration: 1,
      startTime: formatDate(startTime),
      endTime: formatDate(new Date(startTime.getTime() + 2 * 60 * 60 * 1000)),
      competition: currMatch?.compName ?? 'Unknown Competition',
      status: currMatch.status,
      homeTeam: currMatch?.homeTeam?.name ?? 'Unknown Home Team',
      homeScore: currMatch?.homeTeam?.score ?? null,
      awayTeam: currMatch?.awayTeam?.name ?? 'Unknown Away Team',
      awayScore: currMatch?.awayTeam?.score ?? null,
      broadcaster: currMatch?.broadcasters ?? null,
      location: currMatch?.venue?.name ?? 'Unknown Venue',
    }
    
    return acc;
  }, rugbyMatches)

  if(!updatesToCalendarNeeded) {
    console.log('No Updates needed');
    return;
  }

  fs.writeFileSync('rugbymatches.json', JSON.stringify(rugbyMatchesUpdated, null, 2), 'utf8');

  let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MyApp//EN\n';

  Object.entries(rugbyMatchesUpdated).forEach(([id, match]) => {
    ical += 'BEGIN:VEVENT\n';
    ical += `UID:${id}@rugbyviz.com\n`;
    ical += `DTSTAMP:${match.calCreated}\n`;
    ical += `SEQUENCE:${match.updateIteration}\n`;
    
    if(match.lastModified) {
      ical += `LAST-MODIFIED:${match.lastModified}\n`;
    }

    ical += `DTSTART:${match.startTime}\n`;
    ical += `DTEND:${match.endTime}\n`;
    ical += `SUMMARY:${match.homeTeam} vs ${match.awayTeam}\n`;

    let description = `${match.competition}\\n`;
    description += `Broadcasters: ${match.broadcaster?.join(', ') ?? 'Not Televised'}\\n`;
    
    if (match.status === 'result') { 
      description += `Result: ${match.homeTeam} ${match.homeScore} : ${match.awayScore} ${match.awayTeam}\\n`;
    }

    ical += `DESCRIPTION:${description}\n`;
    ical += `LOCATION:${match.location}\n`;
    ical += 'END:VEVENT\n';
  })

  ical += 'END:VCALENDAR';

  fs.writeFileSync('rugby_matches.ics', ical);
  console.log('iCal file created: rugby_matches.ics');
})()