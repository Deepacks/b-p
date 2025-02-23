import React, { Component } from 'react';
import 'reset-css/reset.css';
import './App.css';
import queryString from 'query-string';

let defaultStyle = {
  color: '#fff'
};
let counterStyle = {...defaultStyle,
  width: "40%",
  display: 'inline-block',
  'margin-bottom': '20px',
  'font-size': '50px',
  'line-height': '120px'
}

class PlaylistCounter extends Component {
  render() {
    let playlistCounterStyle = counterStyle
    return (
      <div style={playlistCounterStyle}>
        <h2>{this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

class HoursCounter extends Component {
  render() {
    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])
    let totalDuration = allSongs.reduce((sum, eachSong) => {
      return sum + eachSong.duration
    }, 0)
    let hoursCounterStyle = counterStyle
    return (
      <div style={hoursCounterStyle}>
        <h2>{Math.round(totalDuration/60)} hours</h2>
      </div>
    );
  }
}

class Filter extends Component {
  render() {
    return (
      <div style={defaultStyle}>
        <img/>
        <input type="text" onKeyUp={event =>
          this.props.onTextChange(event.target.value)}
          style={{ 'font-size': '20px', padding: '2px'}}/>
      </div>
    );
  }
}

class Playlist extends Component {
  render() {
    let playlist = this.props.playlist
    return (
      <div style={{...defaultStyle,
        display: 'inline-block',
        width: "25%",
        height: '200px',
        padding: '50px',
        'padding-top': '50px',
        'background-color': this.props.index % 2
        ? '#141414'
        : '#181818'
      }}>
        <img src={playlist.imageUrl} style={{width: '60px'}}/>
        <h3 style={{'font-size': '28px'}}>{playlist.name}</h3>
        <ul style={{'margin-top': '12px', 'font-size': '20px'}}>
          {playlist.songs.map(song =>
            <li style={{'padding-top': '2px'}}>‣{song.name}</li>
          )}
        </ul>
      </div>
    );
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      serverData: {},
      filterString: ''
    }
  }
  componentDidMount() {
    let parsed = queryString.parse(window.location.search);
    let accessToken = parsed.access_token;
    if (!accessToken)
      return;
    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(data => this.setState({
      user: {
        name: data.display_name
      }
    }))

    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then(response => response.json())
    .then(playlistData => {
      let playlists= playlistData.items
      let trackDataPromises = playlists.map(playlist => {
        let responsePromise = fetch(playlist.tracks.href, {
          headers: {'Authorization': 'Bearer ' + accessToken}
        })
        let trackDataPromise = responsePromise
          .then(response => response.json())
        return trackDataPromise
      })
      let allTracksDataPromises =
        Promise.all(trackDataPromises)
      let playlistsPromise = allTracksDataPromises.then(trackDatas => {
          trackDatas.forEach((trackData, i) => {
            playlists[i].trackDatas = trackData.items
              .map(item => item.track)
              .map(trackData => ({
                name: trackData.name,
                duration: trackData.duration_ms / 60 / 60
              }))
          })
          return  playlists
        })
        return playlistsPromise
    })
    .then(playlists => this.setState({
      playlists: playlists.map(item => {
        return {
          name: item.name,
          imageUrl: item.images[0].url,
          songs: item.trackDatas.slice(0,3)
        }
    })
    }))

  }
  render() {
    let playlistToRender =
      this.state.user &&
      this.state.playlists
        ? this.state.playlists.filter(playlist => {
          let matchesPlaylist = playlist.name.toLowerCase().includes(
            this.state.filterString.toLowerCase())
          let matchesSong = playlist.songs.find(song => song.name.toLowerCase()
            .includes(this.state.filterString.toLowerCase()))
          return matchesPlaylist || matchesSong
          }) : []
    return (
      <div className="App">
        {this.state.user
          ? <div>
            <h1 style={{...defaultStyle,
              'font-size': '60px',
              'margin-top': '5px',
              'font-weight': 'bold'
            }}>
            {this.state.user.name}'s Playlists
            </h1>
            <PlaylistCounter playlists={playlistToRender}/>
            <HoursCounter playlists={playlistToRender}/>
            <Filter onTextChange={text => {
              this.setState({filterString: text})
            }}/>
            {playlistToRender.map((playlist, i) =>
              <Playlist playlist={playlist} index={i} />
            )}
          </div>
          : <div style={{
            background: '#000000'
          }}>
            <div>
              <img src="https://developer.spotify.com/assets/branding-guidelines/icon3@2x.png"/>
            </div>

            <div>
              <button onClick={() => {
                window.location = window.location.href.includes('localhost')
                  ? 'http://localhost:8888/login'
                  : 'https://bps-backend.herokuapp.com/login' }
              }
              style={{
                'font-size': '50px',
                'font-weight': 'bold',
                padding: '20px',
                background: '#000000',
                color: 'white',
                border: 'none',
              }}>Sign in with Spotify</button>
            </div>
            <div style={{
              background: '#000000',
              padding: '100%',
            }}>
            </div>
          </div>
        }
      </div>
    );
  }
}

export default App;
