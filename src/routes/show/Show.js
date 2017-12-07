/**
 * React Starter Kit (https://www.reactstarterkit.com/)
 *
 * Copyright © 2014-present Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import s from './Show.css';

const Song = ({ song }) => <p> {song} </p>;

function readCookie(name) {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

class Show extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      songs: [],
      artist: '',
      spotifyTracks: [],
      spotifyURIs: []
    };
    this.getSongUri = this.getSongUri.bind(this);
  }

  componentDidMount() {
    let data = sessionStorage.getItem('selectedSongs');
    data = JSON.parse(data);
    const songs = data.map(d => d.name);
    console.log(songs);
    this.setState({
      artist: readCookie('artistName'),
      songs: songs
    });
    this.getSongUri();
  }

  //artist is string 'artist'
  //songs is array of song names
  getSongUri() {
    let data = sessionStorage.getItem('selectedSongs');
    data = JSON.parse(data);
    const songs = data.map(d => d.name);
    let tracks = songs;
    let artist = readCookie('artistName')
    artist = artist.trim();
    let artistQuery = artist.replace(/ /g, '+');
    let completeQueryCount = 0;
    let unavailableTracks = [];
    let availableTracks = [];
    let accessToken = readCookie('access_token');
    tracks.forEach(trackName => {
      trackName = trackName.trim();
      let trackQuery = trackName.replace(/ /g, '+');
      fetch(
        `https://api.spotify.com/v1/search?q=artist:${artistQuery}%20track:${trackQuery}&type=track`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ).then(response => {
        response.json().then(data => {
          completeQueryCount++;
          const res_tracks = data.tracks;
          if (res_tracks.items.length === 0) {
            // song is not on spotify
            unavailableTracks.push({
              artist: artist,
              track: trackName
            });
          } else {
            // song is there
            availableTracks.push({
              artist: data.tracks.items[0].artists[0].name,
              track: data.tracks.items[0].name,
              spotifyUri: data.tracks.items[0].uri,
            });
          }
          if(completeQueryCount === tracks.length){
            //after all calls have beend one
            let availableTrackURIs = availableTracks.map(track => { return track.spotifyUri });
            let availableTrackNames = availableTracks.map(track => { return track.track });
            this.setState({
              spotifyTracks: availableTrackNames,
              spotifyURIs:   availableTrackURIs
            })
            let sendingTracks = JSON.stringify({availableTracks});
            let headers= new Headers({
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                              })

            let myInit = { method: 'POST',
                          headers: headers,
                          body:    JSON.stringify({availableTrackURIs})
                          };

            fetch('v1/setsToSpotify', myInit)
              .then(function(response) {  console.log(response) })
            return availableTracks;
          }
        });
      });
    });
  }

  render() {
    let songInputs = this.state.songs.map((song, index) => (
      <Song key={index} song={song} />
    ));

    let spotifyInputs = this.state.spotifyTracks.map((song, index) => (
      <Song key={index} song={song} />
    ));
    return (
      <div className={s.banner}>
        <div className={s.container}>
          <h1 className={s.bannerTitle}>Artist: {this.state.artist}</h1>
        </div>
        <div className={s.formLeft}>
          <div className={s.formOne}>
            <form method="post">
              <div className={s.formGroup}>
                <h2>All Songs Found:</h2>
                <div className={s.songContainer}>{songInputs}</div>
              </div>
            </form>
          </div>
        </div>
        <div className={s.formLeft}>
          <div className={s.formOne}>
            <form method="post">
              <div className={s.formGroup}>
                <h2>Songs On Spotify</h2>
                  <div className={s.songContainer}>{songInputs}</div>
              </div>
            </form>
          </div>
        </div>
        <div >
          <button className={s.button} onClick={this.getSongUri}>
            Create Spotify Playlist
          </button>
        </div>
      </div>
    );
  }
}

export default withStyles(s)(Show);
