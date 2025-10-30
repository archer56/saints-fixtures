// https://rugby-union-feeds.incrowdsports.com/v1/matches?provider=rugbyviz&season=202501&compId=1297&sort=date&form=true&images=true

import axios from "axios";
// @ts-ignore
import fs from 'fs';


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

const getSaintsHomeGames = async (competitionId: string) => {
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

// @ts-ignore
function formatDate(date) {
  return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

( async() => {
  const data = await Promise.all([
    getSaintsHomeGames(compId.premiership),
    getSaintsHomeGames(compId.premiershipCup),
    getSaintsHomeGames(compId.championsCup),
    getSaintsHomeGames(compId.challengeCup)
  ])

  // @ts-ignore
  const orderedMatches = data.flat().sort((a, b) => new Date(a.date) - new Date(b.date));


  let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MyApp//EN\n';


  orderedMatches.forEach(match => {
    const start = new Date(match.date);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2-hour match

    const competition = match.compName;
    const description = match.status === 'result' ? `${match.homeTeam.name} ${match.homeTeam.score} : ${match.awayTeam.score} ${match.awayTeam.name}` : `Broadcasters: ${match.broadcasters?.join(', ') ?? 'Not Televised'}`;

    ical += 'BEGIN:VEVENT\n';
    ical += `UID:${match.id}@rugbyviz.com\n`;
    ical += `DTSTAMP:${formatDate(new Date())}\n`;
    ical += `DTSTART:${formatDate(start)}\n`;
    ical += `DTEND:${formatDate(end)}\n`;
    ical += `SUMMARY:${match.homeTeam.name} vs ${match.awayTeam.name}\n`;
    ical += `DESCRIPTION:${competition} - ${description}\n`;
    ical += `LOCATION:${match.venue.name}\n`;
    ical += 'END:VEVENT\n';
  });

  ical += 'END:VCALENDAR';

  fs.writeFileSync('rugby_matches.ics', ical);
  console.log('iCal file created: rugby_matches.ics');
})()