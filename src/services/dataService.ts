import Papa from 'papaparse';

export interface NeedReport {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  urgency: number; // 1 to 10
  status: 'open' | 'claimed' | 'resolved';
  category: string;
  peopleAffected?: number;
  timeNeeded?: string;
  trustScore?: number;
}

export interface Volunteer {
  id: string;
  lat: number;
  lng: number;
  skills: string[];
  availability: string;
  radiusKm: number;
}

// Convert 311 Dataset to our NeedReport format
export const loadNeedsFrom311 = async (): Promise<NeedReport[]> => {
  return new Promise((resolve) => {
    Papa.parse('/data/311_Service_Requests_from_2010_to_Present.csv', {
      download: true,
      header: true,
      preview: 50, // Just load the first 50 rows to keep it fast for prototyping
      complete: (results) => {
        const needs: NeedReport[] = [];
        results.data.forEach((row: any, index) => {
          const lat = parseFloat(row.Latitude);
          const lng = parseFloat(row.Longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            needs.push({
              id: row['Unique Key'] || `311-${index}`,
              lat,
              lng,
              title: row['Complaint Type'] || 'Community Need',
              description: row['Descriptor'] || 'Needs attention',
              urgency: Math.floor(Math.random() * 5) + 6, // Random urgency 6-10 for critical demo
              status: 'open',
              category: row['Agency'] || 'General',
              peopleAffected: Math.floor(Math.random() * 100) + 5,
              timeNeeded: `${Math.floor(Math.random() * 3) + 1} hrs`,
              trustScore: Math.floor(Math.random() * 50) + 10,
            });
          }
        });
        
        // If the CSV was empty or no valid lat/lng, provide fallback data
        if (needs.length === 0) {
          resolve(getFallbackNeeds());
        } else {
          resolve(needs);
        }
      },
      error: () => {
        resolve(getFallbackNeeds());
      }
    });
  });
};

export const loadVolunteers = async (): Promise<Volunteer[]> => {
  return new Promise((resolve) => {
    Papa.parse('/data/volunteer_dataset.csv', {
      download: true,
      header: true,
      complete: (results) => {
        const volunteers: Volunteer[] = [];
        results.data.forEach((row: any) => {
          const lat = parseFloat(row.Latitude || row.latitude);
          const lng = parseFloat(row.Longitude || row.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            volunteers.push({
              id: row.volunteer_id,
              lat,
              lng,
              skills: row.skills ? row.skills.split(',').map((s: string) => s.trim()) : [],
              availability: row.availability,
              radiusKm: parseFloat(row.radius_km) || 10,
            });
          }
        });
        resolve(volunteers);
      },
      error: () => resolve([])
    });
  });
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const getMatchingVolunteers = async (need: NeedReport): Promise<Volunteer[]> => {
  const allVolunteers = await loadVolunteers();
  return allVolunteers.filter(volunteer => {
    const distance = calculateDistance(need.lat, need.lng, volunteer.lat, volunteer.lng);
    const withinRadius = distance <= volunteer.radiusKm;
    
    // Optional: Skill matching could be added here
    // For now, focusing on the user's primary request of distance matching
    return withinRadius;
  });
};

const getFallbackNeeds = (): NeedReport[] => [
  {
    id: 'fb-1',
    lat: 40.7128,
    lng: -74.0060,
    title: 'No water supply in school',
    description: 'School has no water for 3 days.',
    urgency: 10,
    status: 'open',
    category: 'Water',
    peopleAffected: 200,
    timeNeeded: '2 hrs',
    trustScore: 45
  },
  {
    id: 'fb-2',
    lat: 40.7200,
    lng: -74.0100,
    title: 'Fallen tree blocking road',
    description: 'Large oak tree fell during the storm.',
    urgency: 8,
    status: 'open',
    category: 'Emergency',
    peopleAffected: 50,
    timeNeeded: '4 hrs',
    trustScore: 20
  }
];

export const getTrustScore = (reportId: string, baseScore: number): number => {
  try {
    const raw = localStorage.getItem(`trust:${reportId}`);
    if (!raw) return baseScore;
    const { upvotes, downvotes, verifiedBonus } = JSON.parse(raw);
    return baseScore
      + (upvotes   || 0) * 5
      - (downvotes || 0) * 3
      + (verifiedBonus ? 15 : 0);
  } catch { return baseScore; }
};

export const saveTrustVote = (reportId: string, vote: 'up' | 'down') => {
  const raw  = localStorage.getItem(`trust:${reportId}`);
  const data = raw ? JSON.parse(raw) : { upvotes: 0, downvotes: 0, verifiedBonus: false };
  if (vote === 'up') { 
    data.upvotes++; 
    if (data.upvotes >= 2) data.verifiedBonus = true; 
  }
  if (vote === 'down') {
    data.downvotes++;
  }
  localStorage.setItem(`trust:${reportId}`, JSON.stringify(data));
};
