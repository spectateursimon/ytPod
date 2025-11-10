/**
 * ytPod Usage Example
 *
 * This example demonstrates how to integrate the ytPod component
 * into your React application.
 */

import React from 'react';
import IPod from './src/components/iPod';

// Example song data
const songs = [
  {
    title: "Phetamines",
    artist: "Ally Evenson",
    album: "Phetamines (Single)",
    image: "https://f4.bcbits.com/img/0029886597_10.jpg",
    youtubeId: "Us4gHuTnVUk"
  },
  {
    title: "Bed",
    artist: "CENDE",
    album: "#1 Hit Single",
    image: "https://f4.bcbits.com/img/a3875451684_16.jpg",
    youtubeId: "OLbhp2YN3m0"
  },
  {
    title: "моє місце (My Place)",
    artist: "левко (Levko)",
    album: "труднощі",
    image: "https://f4.bcbits.com/img/a1459456759_10.jpg",
    youtubeId: "YDlAF-nBr58"
  }
];

// Basic usage
export function BasicExample() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <IPod songs={songs} />
    </div>
  );
}

// With custom container
export function CustomContainerExample() {
  return (
    <div className="my-custom-container">
      <h1>My Music Player</h1>
      <IPod songs={songs} />
    </div>
  );
}

// Fetch songs from API
export function DynamicSongsExample() {
  const [songs, setSongs] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch songs from your API
    fetch('/api/songs')
      .then(res => res.json())
      .then(data => {
        setSongs(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <IPod songs={songs} />;
}

// Export default example
export default BasicExample;
