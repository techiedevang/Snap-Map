import React, { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Users, ArrowRight, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react';
import { getMatchingVolunteers, getTrustScore, saveTrustVote } from '../services/dataService';
import type { NeedReport, Volunteer } from '../services/dataService';
import './StoryCard.css';

interface StoryCardProps {
  need: NeedReport;
  onCommit: (id: string) => void;
  onClose: () => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ need, onCommit, onClose }) => {
  const [matchingVolunteers, setMatchingVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    const fetchVolunteers = async () => {
      setLoading(true);
      const volunteers = await getMatchingVolunteers(need);
      setMatchingVolunteers(volunteers);
      setLoading(false);
    };
    fetchVolunteers();
  }, [need]);

  const liveScore = getTrustScore(need.id, need.trustScore ?? 0);

  const handleUpvote = () => {
    if (userVote === 'up') return;
    saveTrustVote(need.id, 'up');
    setUserVote('up');
  };

  const handleDownvote = () => {
    if (userVote === 'down') return;
    saveTrustVote(need.id, 'down');
    setUserVote('down');
  };

  return (
    <div className="story-card glass">
      <div className="story-header">
        <div className="trust-badge">
          {liveScore > 30 && (
            <span className="certified">
              <ShieldCheck size={16} /> Community Certified
            </span>
          )}
        </div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="story-image-placeholder">
        <div className="urgency-tag" style={{ backgroundColor: need.urgency >= 8 ? 'var(--accent-critical)' : 'var(--accent-primary)' }}>
          Urgency: {need.urgency}/10
        </div>
      </div>

      <div className="story-content">
        <h3>{need.title}</h3>
        <p className="description">{need.description}</p>

        <div className="impact-stats">
          <div className="stat">
            <Users size={18} />
            <span>{need.peopleAffected} affected</span>
          </div>
          <div className="stat">
            <Clock size={18} />
            <span>{need.timeNeeded}</span>
          </div>
        </div>

        {/* Nearby Volunteers Section */}
        <div className="volunteer-match-section">
          <h4><MapPin size={16} /> Nearby Volunteers</h4>
          {loading ? (
            <div className="loading-small">Finding heroes nearby...</div>
          ) : (
            <div className="volunteers-list">
              {matchingVolunteers.length > 0 ? (
                <>
                  <div className="volunteer-count">
                    <strong>{matchingVolunteers.length}</strong> volunteers found in the area
                  </div>
                  <div className="skills-cloud">
                    {Array.from(new Set(matchingVolunteers.flatMap(v => v.skills))).slice(0, 5).map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="no-volunteers">No volunteers within range yet.</div>
              )}
            </div>
          )}
        </div>

        <div className="trust-circles">
          <span className="trust-label">Trust Circle:</span>
          <button
            className={`vote-btn ${userVote === 'up' ? 'voted-up' : ''}`}
            onClick={handleUpvote}
          >
            <ThumbsUp
              size={16}
              color={userVote === 'up' ? 'var(--accent-primary)' : 'currentColor'}
              fill={userVote === 'up' ? 'var(--accent-primary)' : 'none'}
            />
            {liveScore}
          </button>
          <button
            className={`vote-btn ${userVote === 'down' ? 'voted-down' : ''}`}
            onClick={handleDownvote}
          >
            <ThumbsDown
              size={16}
              color={userVote === 'down' ? 'var(--accent-critical)' : 'currentColor'}
              fill={userVote === 'down' ? 'var(--accent-critical)' : 'none'}
            />
            {liveScore}
          </button>
        </div>
      </div>

      <button className="commit-btn" onClick={() => onCommit(need.id)}>
        Commit to Help <ArrowRight size={18} />
      </button>
    </div>
  );
};

export default StoryCard;
