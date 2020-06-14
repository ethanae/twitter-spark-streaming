import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@material-ui/core';
import Chart from "react-apexcharts";
import axios from 'axios';

const Words = () => {
  const [words, setWords] = useState([]);
  const [totalWords, setTotalWords] = useState({ total: 0 });
  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/words/frequencies')
      .then(d => d.data)
      .then(setWords)
      .catch(err => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/words/count')
      .then(d => d.data)
      .then(setTotalWords)
      .catch(err => {
        console.log(err);
      });
  }, []);
  const options = {
    options: {
      chart: {
        id: "basic-bar"
      },
      xaxis: {
        categories: words.map(x => x.word)
      }
    },
    series: [
      {
        name: "most common words",
        data: words.map(x => x.frequency)
      }
    ]
  };
  return (
    <Box component="div" m={5}>
      <Typography variant="h4">
        All Words
      </Typography>
      <Box component="div" m={2} border="">
        <Typography variant="h6">
          1. Total Words Analysed: {totalWords.total}
        </Typography>
      </Box>
      <Box component="div" m={2}>
        <hr />
      </Box>
      <Box component="div" m={2} border="">
        <Typography variant="h6" >
          2. The {words.length} Most Common Words Found in Tweets
        </Typography>
        <Chart width="70%" height="325" options={options.options} series={options.series} type="bar" />
      </Box>
    </Box>
  );
};

export default Words;