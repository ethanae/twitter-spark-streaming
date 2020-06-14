import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@material-ui/core';
import Chart from "react-apexcharts";
import axios from 'axios';

const Tweets = () => {
  const [tweetCount, setTweetCount] = useState(0);
  const [tweetLocations, setTweetLocations] = useState([]);
  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/tweet/locations')
      .then(d => d.data)
      .then(setTweetLocations)
      .catch(err => {
        console.log(err);
      });
  }, []);
  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/tweet/count')
      .then(d => d.data)
      .then(setTweetCount)
      .catch(err => {
        console.log(err);
      });
  }, []);
  const options = {
    options: {
      labels: tweetLocations.map(x => x._id)
    },
    series: tweetLocations.map(x => x.count)
  };

  return (
    <Box component="div" m={5}>
      <Typography variant="h4">
        Tweets
      </Typography>
      <Box m={2}>
        <Typography variant="h6">
          1. Total Tweets Processed: {tweetCount}
        </Typography>
      </Box>
      <Box m={2}>
        <Typography variant="h6">
          2. {tweetLocations.length} Most Frequent Tweet Locations
        </Typography>
        <Chart width="70%" height="325" type="pie" series={options.series} options={options.options} />
      </Box>
    </Box>
  );
};

export default Tweets;