# Credits and Attribution

## Original Project

This project is based on [iPod.js](https://github.com/tvillarete/ipod-classic-js) by [Tanner Villarete](https://github.com/tvillarete).

The original iPod.js is an incredible recreation of the iPod Classic interface with support for Apple Music and Spotify. This project (ytPod) adapts the core interface concepts for YouTube-based playback.

## What Was Retained from iPod.js

### Core UI Concepts
- **Click Wheel Design**: The circular touch-sensitive wheel interface
- **iPod Classic Styling**: Silver theme with authentic iPod aesthetic
- **Screen Layout**: Menu view and Now Playing view structure
- **Button Positions**: Menu, Play/Pause, Previous, Next, and Select button placement

### Interaction Patterns
- **Circular Scroll Detection**: Algorithm for detecting circular motion on the click wheel
- **Angle Calculation**: Math for determining scroll direction (clockwise/counter-clockwise)
- **Touch/Pointer Events**: Event handling for wheel interaction
- **Helper Functions**:
  - `getCircularBoundingInfo()` - Calculate wheel center and radius
  - `getAngleBetweenPoints()` - Calculate angle between two points
  - `getScrollDirection()` - Determine scroll direction from angle delta
  - `checkIsPointWithinElement()` - Check if pointer is within element bounds

### Constants
- `ANGLE_OFFSET_THRESHOLD` (10) - Minimum angle change for scroll detection
- `PAN_THRESHOLD` (5) - Minimum distance for pan detection

### CSS Approach
- iPod shell gradient and shadow styles
- Click wheel appearance (white background, border, shadows)
- Center button styling
- Responsive design patterns

## What Is New in ytPod

### Complete Reimplementation

#### 1. YouTube Integration
- **YouTube IFrame API Integration**: Complete implementation for video playback
- **Audio-Only Playback**: Videos play in hidden iframe (0x0 dimensions)
- **State Management**: Handling YouTube player states (PLAYING, PAUSED, ENDED)
- **Auto-Advance**: Automatically play next song when current ends
- **Smart Song Loading**: Detect when to reload vs. just switch view

#### 2. Enhanced Now Playing View
- **Horizontal Layout**: Album art on left, track info on right
- **3D Album Art**: Transform effect with perspective for depth
- **Overflow Detection**: Dynamic detection of text overflow
  - Only applies marquee animation to overflowing text
  - Checks title, artist, and album independently
  - Uses refs to measure actual DOM element dimensions
- **Conditional Marquee**: Text scrolls only when playing AND overflowing
- **Progress Bar**: Visual playback progress with time display
- **Time Formatting**: MM:SS format for current time and duration

#### 3. Menu Enhancements
- **Playing Indicator**: ▶ icon next to currently playing song
- **Color Coding**: Blue indicator when not selected, white when selected
- **Auto-Scroll**: Menu automatically scrolls to keep active item visible
- **Song Count Display**: Shows total number of songs in header

#### 4. Smart Navigation
- **Return to Now Playing**: Can return to Now Playing view without restarting song
- **Menu Highlighting**: Menu highlights current playing song when returning from Now Playing
- **Dual Index System**:
  - `menuIndex` - Currently selected item in menu
  - `currentIndex` - Currently playing song
- **State Preservation**: Player state maintained when switching views

#### 5. Playback Features
- **Progress Tracking**: Real-time progress updates (100ms interval)
- **Duration Display**: Shows current time and total duration
- **Auto-Play Logic**: Handles mobile autoplay restrictions
- **Error Handling**: Graceful fallback when autoplay is prevented
- **Song End Detection**: Proper handling of song completion

#### 6. Bug Fixes & Improvements
- **Stale Closure Fix**: Fixed React stale closure issue in onStateChange
  - Uses functional setState to always get latest state
  - Inline next song logic to avoid callback issues
- **Initial Play Fix**: Checks if video is loaded (duration > 0) before deciding to reload
- **Consistent State**: Maintains isPlaying state through song transitions

#### 7. TypeScript Implementation
- **Full Type Safety**: Complete TypeScript interfaces for all components
- **Song Interface**: Typed song object structure
- **Ref Types**: Proper typing for all React refs
- **Event Types**: Typed event handlers

#### 8. React Hooks Architecture
- **useState**: For all state management
- **useRef**: For player, DOM elements, and state references
- **useCallback**: For memoized event handlers
- **useEffect**: For lifecycle management and side effects

#### 9. Additional Features
- **Disabled Keyboard Controls**: Authentic iPod experience (touch/click only)
- **Screen Reader Support**: Accessibility with sr-only class
- **Mobile Optimization**: Touch-action: none for better mobile control
- **Format Helper**: `formatTime()` function for time display

## Code Structure Comparison

### Original iPod.js
- Built with React/TypeScript
- Uses Apple Music/Spotify APIs
- Complex state management for multiple views
- Extensive animation system
- Multiple screen types (Settings, Artists, Albums, etc.)

### ytPod
- Simplified to 2 views (Menu, Now Playing)
- YouTube IFrame API only
- Focused on music playback
- Streamlined state management
- Single playlist view

## Design Philosophy Differences

### Original iPod.js
- Full iPod OS recreation
- Multiple apps and features
- Complex navigation hierarchy
- Settings and customization

### ytPod
- Music player focus
- Simple, clean interface
- Direct YouTube video playback
- Easy integration into existing projects

## License Compatibility

Both projects are MIT licensed, allowing for this derivative work with proper attribution.

## Acknowledgments

Special thanks to Tanner Villarete for creating the original iPod.js project and open-sourcing the click wheel interaction code. The circular scrolling algorithm and UI layout concepts provided an excellent foundation for this YouTube-focused implementation.

## Contributing to ytPod

While this project borrows core concepts from iPod.js, the YouTube integration, state management, and playback features are entirely new implementations. Contributions that enhance these aspects are welcome!
