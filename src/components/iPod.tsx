import { useEffect, useState, useRef, useCallback } from 'react';
import './iPod.css';

interface Song {
  title: string;
  artist: string;
  album?: string;
  image: string;
  youtubeId: string;
}

interface IPodProps {
  songs: Song[];
}

// Constants from original implementation
const ANGLE_OFFSET_THRESHOLD = 10;
const PAN_THRESHOLD = 5;

// Helper function to format time in MM:SS
const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper functions from original implementation
const getCircularBoundingInfo = (rect: DOMRect) => {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const radius = Math.max(rect.width, rect.height) / 2;

  return {
    radius,
    diameter: radius * 2,
    centerPoint: { x: centerX, y: centerY },
  };
};

const getAngleBetweenPoints = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
) => {
  return Math.round(
    (Math.atan2(point1.y - point2.y, point1.x - point2.x) * 180) / Math.PI
  );
};

const getScrollDirection = (angleDelta: number): 'clockwise' | 'counter-clockwise' => {
  if (Math.abs(angleDelta) > ANGLE_OFFSET_THRESHOLD * 2) {
    return angleDelta > 0 ? 'counter-clockwise' : 'clockwise';
  }
  return angleDelta > 0 ? 'clockwise' : 'counter-clockwise';
};

const checkIsPointWithinElement = (
  point: { x: number; y: number },
  element: HTMLElement | null | undefined
) => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
};

export default function IPod({ songs: initialSongs }: IPodProps) {
  const [songs] = useState<Song[]>(initialSongs || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [menuIndex, setMenuIndex] = useState(0);
  const [view, setView] = useState<'menu' | 'nowPlaying'>('menu');
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressIntervalRef = useRef<number | null>(null);

  // Refs for click wheel interaction
  const wheelRef = useRef<HTMLDivElement>(null);
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const menuListRef = useRef<HTMLDivElement>(null);

  // Refs for overflow detection
  const trackTitleRef = useRef<HTMLHeadingElement>(null);
  const trackArtistRef = useRef<HTMLParagraphElement>(null);
  const trackAlbumRef = useRef<HTMLParagraphElement>(null);

  // State for overflow detection
  const [titleOverflows, setTitleOverflows] = useState(false);
  const [artistOverflows, setArtistOverflows] = useState(false);
  const [albumOverflows, setAlbumOverflows] = useState(false);

  // Pan state
  const isPanning = useRef(false);
  const startPoint = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  // Load YouTube IFrame API
  useEffect(() => {
    // Check if YouTube API is already loaded
    if (window.YT && (window as any).YT.Player) {
      setPlayerReady(true);
    } else if (!window.YT) {
      // Only load script if YT doesn't exist at all
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    } else {
      // YT exists but Player might not be ready yet
      (window as any).onYouTubeIframeAPIReady = () => {
        setPlayerReady(true);
      };
    }
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (playerReady && songs.length > 0 && !playerRef.current) {
      playerRef.current = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: songs[0].youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          playsinline: 1,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: any) => {
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              // Song ended - move to next song
              // We use setCurrentIndex with a function to get the latest state
              setCurrentIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % songs.length;
                // Also update menu index
                setMenuIndex(nextIndex);
                setCurrentTime(0);

                // Load and play next song
                if (playerRef.current) {
                  playerRef.current.loadVideoById(songs[nextIndex].youtubeId);
                  setTimeout(() => {
                    if (playerRef.current) {
                      try {
                        playerRef.current.playVideo();
                      } catch (e) {
                        console.log('Autoplay prevented');
                      }
                      setDuration(playerRef.current.getDuration());
                    }
                  }, 500);
                }

                return nextIndex;
              });
              setIsPlaying(true);
            } else if (event.data === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              // Start progress tracking
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
              }
              progressIntervalRef.current = window.setInterval(() => {
                if (playerRef.current) {
                  setCurrentTime(playerRef.current.getCurrentTime());
                }
              }, 100);
            } else if (event.data === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              // Stop progress tracking
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          },
        },
      });
    }

    // Cleanup interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [playerReady, songs]);

  // Auto-scroll menu item into view
  useEffect(() => {
    if (view === 'menu' && menuListRef.current) {
      const activeItem = menuListRef.current.children[menuIndex] as HTMLElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [menuIndex, view]);

  // Check for text overflow on now playing view
  useEffect(() => {
    if (view === 'nowPlaying') {
      const checkOverflow = () => {
        if (trackTitleRef.current) {
          const isOverflowing = trackTitleRef.current.scrollWidth > trackTitleRef.current.clientWidth;
          setTitleOverflows(isOverflowing);
        }
        if (trackArtistRef.current) {
          const isOverflowing = trackArtistRef.current.scrollWidth > trackArtistRef.current.clientWidth;
          setArtistOverflows(isOverflowing);
        }
        if (trackAlbumRef.current) {
          const isOverflowing = trackAlbumRef.current.scrollWidth > trackAlbumRef.current.clientWidth;
          setAlbumOverflows(isOverflowing);
        }
      };

      // Check immediately and after a short delay to ensure content is rendered
      checkOverflow();
      const timeout = setTimeout(checkOverflow, 100);

      return () => clearTimeout(timeout);
    }
  }, [view, currentIndex, songs]);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current || songs.length === 0) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, songs.length]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % songs.length;
    setCurrentIndex(nextIndex);
    setMenuIndex(nextIndex);
    setCurrentTime(0);
    if (playerRef.current) {
      playerRef.current.loadVideoById(songs[nextIndex].youtubeId);
      // Always try to play on next/prev for mobile autoplay
      setTimeout(() => {
        if (playerRef.current && isPlaying) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            console.log('Autoplay prevented, user needs to click play');
          }
        }
        if (playerRef.current) {
          setDuration(playerRef.current.getDuration());
        }
      }, 500);
    }
  }, [currentIndex, songs, isPlaying]);

  const handlePrev = useCallback(() => {
    const prevIndex = currentIndex === 0 ? songs.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setMenuIndex(prevIndex);
    setCurrentTime(0);
    if (playerRef.current) {
      playerRef.current.loadVideoById(songs[prevIndex].youtubeId);
      // Always try to play on next/prev for mobile autoplay
      setTimeout(() => {
        if (playerRef.current && isPlaying) {
          try {
            playerRef.current.playVideo();
          } catch (e) {
            console.log('Autoplay prevented, user needs to click play');
          }
        }
        if (playerRef.current) {
          setDuration(playerRef.current.getDuration());
        }
      }, 500);
    }
  }, [currentIndex, songs, isPlaying]);

  const handleMenuUp = useCallback(() => {
    if (view === 'menu') {
      const newIndex = menuIndex === 0 ? songs.length - 1 : menuIndex - 1;
      setMenuIndex(newIndex);
    }
  }, [view, menuIndex, songs.length]);

  const handleMenuDown = useCallback(() => {
    if (view === 'menu') {
      const newIndex = (menuIndex + 1) % songs.length;
      setMenuIndex(newIndex);
    }
  }, [view, menuIndex, songs.length]);

  const handleSelect = useCallback(() => {
    if (view === 'menu') {
      // If selecting the currently playing song AND a video is already loaded, just switch to now playing view
      if (menuIndex === currentIndex && duration > 0) {
        setView('nowPlaying');
      } else {
        // Otherwise, load and play the new song
        setCurrentIndex(menuIndex);
        setView('nowPlaying');
        setCurrentTime(0);
        if (playerRef.current) {
          playerRef.current.loadVideoById(songs[menuIndex].youtubeId);
          // Delay playVideo to ensure video is loaded
          setTimeout(() => {
            if (playerRef.current) {
              try {
                playerRef.current.playVideo();
                setIsPlaying(true);
              } catch (e) {
                console.log('Autoplay prevented, user needs to click play');
              }
              setDuration(playerRef.current.getDuration());
            }
          }, 500);
        }
      }
    }
  }, [view, menuIndex, currentIndex, duration, songs]);

  const handleMenu = useCallback(() => {
    if (view === 'nowPlaying') {
      setView('menu');
      // Set menu index to current song so it's highlighted
      setMenuIndex(currentIndex);
    }
  }, [view, currentIndex]);

  // Circular scroll detection with pan gestures
  const handlePanStart = useCallback((event: PointerEvent) => {
    isPanning.current = true;
    startPoint.current = { x: event.clientX, y: event.clientY };
    startOffset.current = { x: event.clientX, y: event.clientY };
  }, []);

  const handlePan = useCallback((event: PointerEvent) => {
    if (!isPanning.current || !wheelRef.current) return;

    const { centerPoint } = getCircularBoundingInfo(
      wheelRef.current.getBoundingClientRect()
    );
    const currentPoint = { x: event.clientX, y: event.clientY };

    const startAngleDeg = getAngleBetweenPoints(startPoint.current, centerPoint);
    const currentAngleDeg = getAngleBetweenPoints(currentPoint, centerPoint);
    const angleDelta = currentAngleDeg - startAngleDeg;
    const direction = getScrollDirection(angleDelta);

    const hasScrolled = Math.abs(angleDelta) > ANGLE_OFFSET_THRESHOLD;

    if (hasScrolled) {
      startPoint.current = currentPoint;

      if (direction === 'clockwise') {
        handleMenuDown();
      } else {
        handleMenuUp();
      }
    }
  }, [handleMenuDown, handleMenuUp]);

  const handlePanEnd = useCallback((event: PointerEvent) => {
    const deltaX = event.clientX - startOffset.current.x;
    const deltaY = event.clientY - startOffset.current.y;

    const isPressEvent =
      Math.abs(deltaX) < PAN_THRESHOLD && Math.abs(deltaY) < PAN_THRESHOLD;

    if (isPressEvent) {
      const point = { x: event.clientX, y: event.clientY };

      // Check if click was on SELECT button
      if (checkIsPointWithinElement(point, selectButtonRef.current)) {
        handleSelect();
      } else if (checkIsPointWithinElement(point, menuButtonRef.current)) {
        handleMenu();
      } else if (checkIsPointWithinElement(point, prevButtonRef.current)) {
        handlePrev();
      } else if (checkIsPointWithinElement(point, nextButtonRef.current)) {
        handleNext();
      } else if (checkIsPointWithinElement(point, playButtonRef.current)) {
        handlePlayPause();
      }
    }

    isPanning.current = false;
  }, [handleMenu, handlePrev, handleNext, handlePlayPause, handleSelect]);

  // Set up event listeners for click wheel
  useEffect(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;

    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      handlePanStart(e);
      wheel.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isPanning.current) {
        e.preventDefault();
        handlePan(e);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      e.preventDefault();
      handlePanEnd(e);
      wheel.releasePointerCapture(e.pointerId);
    };

    wheel.addEventListener('pointerdown', onPointerDown);
    wheel.addEventListener('pointermove', onPointerMove);
    wheel.addEventListener('pointerup', onPointerUp);

    return () => {
      wheel.removeEventListener('pointerdown', onPointerDown);
      wheel.removeEventListener('pointermove', onPointerMove);
      wheel.removeEventListener('pointerup', onPointerUp);
    };
  }, [handlePanStart, handlePan, handlePanEnd]);

  // Keyboard controls - DISABLED for authentic iPod experience
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     switch (e.key) {
  //       case 'ArrowUp':
  //         handleMenuUp();
  //         break;
  //       case 'ArrowDown':
  //         handleMenuDown();
  //         break;
  //       case 'ArrowLeft':
  //         handlePrev();
  //         break;
  //       case 'ArrowRight':
  //         handleNext();
  //         break;
  //       case 'Enter':
  //         handleSelect();
  //         break;
  //       case ' ':
  //         e.preventDefault();
  //         handlePlayPause();
  //         break;
  //       case 'Escape':
  //         handleMenu();
  //         break;
  //     }
  //   };

  //   window.addEventListener('keydown', handleKeyDown);
  //   return () => window.removeEventListener('keydown', handleKeyDown);
  // }, [handleMenuUp, handleMenuDown, handlePrev, handleNext, handleSelect, handlePlayPause, handleMenu]);

  const currentSong = songs[currentIndex];

  return (
    <div className="ipod-container">
      <div className="ipod">
        <div className="ipod-screen">
          {view === 'menu' && (
            <div className="menu-view">
              <div className="menu-header">
                <h3>All Songs</h3>
                <p className="song-count">{songs.length} songs</p>
              </div>
              <div className="menu-list" ref={menuListRef}>
                {songs.map((song, index) => (
                  <div
                    key={index}
                    className={`menu-item ${index === menuIndex ? 'active' : ''}`}
                  >
                    <span className="song-info">
                      {index === currentIndex && isPlaying && (
                        <span className="playing-indicator">▶</span>
                      )}
                      {song.artist} - {song.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'nowPlaying' && currentSong && (
            <div className={`now-playing${isPlaying ? ' playing' : ''}`}>
              <div className="now-playing-metadata">
                <div className="album-art-container">
                  <img src={currentSong.image} alt={currentSong.title} className="album-art" />
                </div>
                <div className="track-info">
                  <h2
                    ref={trackTitleRef}
                    className={`track-title${titleOverflows ? ' overflowing' : ''}`}
                  >
                    {currentSong.title}
                  </h2>
                  <p
                    ref={trackArtistRef}
                    className={`track-artist${artistOverflows ? ' overflowing' : ''}`}
                  >
                    {currentSong.artist}
                  </p>
                  {currentSong.album && (
                    <p
                      ref={trackAlbumRef}
                      className={`track-album${albumOverflows ? ' overflowing' : ''}`}
                    >
                      {currentSong.album}
                    </p>
                  )}
                </div>
              </div>
              <div className="playback-controls">
                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="time-display">
                    <span className="time-current">{formatTime(currentTime)}</span>
                    <span className="time-separator">/</span>
                    <span className="time-total">{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {songs.length === 0 && (
            <div className="loading">
              <p>Loading songs...</p>
            </div>
          )}
        </div>

        <div className="ipod-controls">
          <div className="click-wheel" ref={wheelRef}>
            <button
              className="wheel-btn menu-btn"
              ref={menuButtonRef}
              onPointerDown={(e) => e.stopPropagation()}
            >
              MENU
            </button>
            <button
              className="wheel-btn prev-btn"
              ref={prevButtonRef}
              onPointerDown={(e) => e.stopPropagation()}
            >
              ⏮︎
            </button>
            <button
              className="wheel-btn next-btn"
              ref={nextButtonRef}
              onPointerDown={(e) => e.stopPropagation()}
            >
              ⏭︎
            </button>
            <button
              className="wheel-btn play-btn"
              ref={playButtonRef}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {isPlaying ? '⏸' : '▶︎'}
            </button>

            <button
              className="select-btn"
              ref={selectButtonRef}
              onClick={handleSelect}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <span className="sr-only">SELECT</span>
            </button>
          </div>
        </div>
      </div>

      <div id="youtube-player" style={{ display: 'none' }}></div>
    </div>
  );
}
