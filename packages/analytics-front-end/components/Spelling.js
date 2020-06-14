import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Chart from "react-apexcharts";
import axios from 'axios';

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

const Spelling = () => {
  const [misspellings, setMisspellings] = useState([]);
  const [totalMisspellings, setTotalMisspellings] = useState(0);
  const [corrections, setCorrections] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/words/misspelled')
      .then(d => d.data)
      .then(x => {
        setMisspellings(x);
        return axios.get(`http://localhost:7896/api/analytics/words/corrections?words=${x.map(x => x._id.original).join(',')}`);
      })
      .then(d => d.data)
      .then(setCorrections)
      .catch(err => {
        console.log(err);
      })
  }, []);
  useEffect(() => {
    axios.get('http://localhost:7896/api/analytics/words/misspelled/count')
      .then(d => d.data)
      .then(setTotalMisspellings)
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
        categories: misspellings.map(x => x._id.original)
      }
    },
    series: [
      {
        name: "most common misspellings",
        data: misspellings.map(x => x.count)
      }
    ]
  };
  const classes = useStyles();
  return (
    
    <Box component="div" m={5}>
      <Typography variant="h4">
        Spelling And Suggested Corrections
      </Typography>
      <Box component="div" m={2} border="">
        <Typography variant="h6">
          1. Total Misspellings Across All Tweets: {totalMisspellings}
        </Typography>
      </Box>
      <Box component="div" m={2} border="">
        <Typography variant="h6" >
          2. The  {misspellings.length} Most Misspelled Words:
        </Typography>
        <Chart height="350" options={options.options} series={options.series} type="bar" />
      </Box>
      <Box component="div" m={2} border="">
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="right">Word</TableCell>
                <TableCell align="right">Suggested Correction</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {corrections.map((c, i) => (
                <TableRow key={i}>
                  <TableCell component="th" scope="row">
                    {c._id}
                  </TableCell>
                  <TableCell align="right">{c.corrections.sort((a,b) => a.length - b.length).slice(0, 5).join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box >
  );
};

export default Spelling;