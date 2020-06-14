import React from 'react';
import { AppBar, Typography, Toolbar } from '@material-ui/core';
import Words from '../components/Words';
import OffensiveWords from '../components/OffensiveWords';
import Spelling from '../components/Spelling';
import Tweets from '../components/Tweets';
import '../node_modules/react-vis/dist/style.css';

const App = () => {
  
  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Tweet Analysis
          </Typography>
        </Toolbar>
      </AppBar>

      <Tweets />
      <Words />
      <OffensiveWords />
      <Spelling />
    </div>

  )
};

export default App;