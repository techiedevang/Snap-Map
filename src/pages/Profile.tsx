import React from 'react';
import { Award, Share2, Leaf, TreePine } from 'lucide-react';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import './Profile.css';

const mockTask = {
  id: 'mock-1',
  title: 'School Water Supply Restored',
  location: 'Bhoor Colony',
  peopleHelped: 43,
  timeSpent: '3 hrs',
  beforeImg: 'https://boonafm.com/wp-content/uploads/2024/11/Untitled-design-2022-02-21T125712.140.jpg',
  afterImg: 'https://i4di.org/wp-content/uploads/2025/02/vecteezy_little-asian-girl-wash-her-hands-before-eating-at-school_2966655-scaled.jpg',
  committedAt: Date.now() - 86400000,
};

const Profile: React.FC = () => {
  const [tasks, setTasks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('committed_tasks');
    const realTasks = saved ? JSON.parse(saved) : [];
    // Combine with mock task and sort
    const allTasks = [mockTask, ...realTasks].sort((a: any, b: any) => b.committedAt - a.committedAt);
    setTasks(allTasks);
  }, []);

  const totalTasks = tasks.length;
  const totalImpact = tasks.reduce((sum, t) => sum + (t.peopleHelped || 0), 0);

  const getLevel = (count: number) => {
    if (count < 3) return { level: 1, title: 'Seedling' };
    if (count < 7) return { level: 2, title: 'Sapling' };
    if (count < 15) return { level: 3, title: 'Forest Guardian' };
    if (count < 30) return { level: 4, title: 'Ancient Protector' };
    return { level: 5, title: 'Legendary Druid' };
  };

  const levelInfo = getLevel(totalTasks);

  // Weekly growth: tasks in the last 7 days
  const lastWeekTasks = tasks.filter(t => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return t.committedAt > oneWeekAgo;
  }).length;

  const treeLayers = Math.min(5, Math.ceil(totalTasks / 2) || 1);

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-section">
          <div className="avatar">
            <TreePine size={48} className="forest-icon" />
          </div>
          <div>
            <h2>Volunteer User</h2>
            <p className="level-text">Level {levelInfo.level} {levelInfo.title}</p>
          </div>
        </div>
        <div className="stats-glass glass">
          <div className="stat-box">
            <Leaf className="stat-icon" />
            <span className="stat-val">{totalTasks}</span>
            <span className="stat-label">Tasks</span>
          </div>
          <div className="stat-box">
            <Award className="stat-icon" />
            <span className="stat-val">{totalImpact}</span>
            <span className="stat-label">Impact</span>
          </div>
        </div>
      </div>

      <div className="impact-tree-section">
        <h3>Your Impact Tree</h3>
        <div className="tree-visualization glass">
          <div className="tree-trunk"></div>
          {Array.from({ length: treeLayers }).map((_, i) => (
            <div key={i} className={`leaves-layer layer-${i + 1}`}></div>
          ))}
          <p>Your tree grew {lastWeekTasks} {lastWeekTasks === 1 ? 'branch' : 'branches'} this week!</p>
        </div>
      </div>

      <div className="receipts-section">
        <h3>Impact Receipts</h3>
        {tasks.length === 0 ? (
          <div className="no-tasks glass">
            <p>No tasks committed yet. Head to the map to start helping!</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="impact-receipt glass">
              <div className="receipt-header">
                <h4>{task.title}</h4>
                <button className="share-btn"><Share2 size={16} /> Share</button>
              </div>
              <p className="receipt-meta">📍 {task.location} • 👥 {task.peopleHelped} affected • ⏱ {task.timeSpent}</p>

              {task.beforeImg && task.afterImg && (
                <div className="slider-wrapper" style={{ marginTop: '12px', marginBottom: '8px' }}>
                  <BeforeAfterSlider beforeImg={task.beforeImg} afterImg={task.afterImg} />
                </div>
              )}

              <div className="certificate-footer">
                <Award size={16} />
                <span>Official Community Certificate</span>
                <span className="date-stamp">{new Date(task.committedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
