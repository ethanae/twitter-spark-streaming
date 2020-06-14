import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@material-ui/core';
import Chart from "react-apexcharts";
import axios from 'axios';

const OffensiveWords = () => {
  const [offensiveWords, setOffensiveWords] = useState([]);
  const [totalOffensiveWords, setTotalOffensiveWords] = useState([]);
  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/words/offensive')
      .then(d => d.data)
      .then(setOffensiveWords)
      .catch(err => {
        console.log(err);
      });
  }, []);
  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/words/offensive/count')
      .then(d => d.data)
      .then(setTotalOffensiveWords)
      .catch(err => {
        console.log(err);
      });
  }, []);
  const offensiveWordsOptions = {
    options: {
      chart: {
        id: "basic-bar"
      },
      xaxis: {
        categories: offensiveWords.map(x => x._id)
      }
    },
    series: [
      {
        name: "offensive words",
        data: offensiveWords.map(x => x.count)
      }
    ]
  };
  return (
    <Box component="div" m={5}>
      <Typography variant="h4">
        Offensive Words
      </Typography>
      <Box component="div" m={2} border="">
        <Typography variant="h6">
          1. Total Offensive Words Seen in All Tweets: {totalOffensiveWords}
        </Typography>
      </Box>
      <Box component="div" m={2}>
        <hr />
      </Box>
      <Box color="text.primary" component="div" m={2} border="">
        <Typography variant="h6" >
          2. The {offensiveWords.length} Most Frequent Offensive Words Found in Tweets
        </Typography>
        <Chart width="70%" height="325" options={offensiveWordsOptions.options} series={offensiveWordsOptions.series} type="bar" />
      </Box>
    </Box>
  );
};

export default OffensiveWords;