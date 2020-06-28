# Tweet Stream Analytics with Apache Spark, Apache Kafka, MongoDB, and NodeJS 

## Project Structure
The project is broken into 4 packages
  - A front-end for data visualisation
  - An API for the front-end to fetch data
  - A server responsible for fetching data from Twitter and sending it to Kafka
  - A data processing engine subscribed to a Kafka topic

## Prerequisites
  - A MongoDB instance, running at `127.0.0.1:27017`
  - Twitter API credentials
  - Apache Spark
  - Apache Kafka
  - NodeJS
  - Scala Build Tools (sbt), if using Maven, populate your Maven file with the dependencies from `packages/tweet-processor/build.sbt`

## How to run the project, assuming a Linux OS
### 1. Apache Kafka v2.5.0 - the default running port is 9092
**All commands are run from within the root of the Kafka directory**
  - Download the Apache Kakfa binaries from https://kafka.apache.org/downloads and follow instructions
  - Start Zookeeper: `bin/zookeeper-server-start.sh config /zookeeper.properties`
  - Start Kafka: `bin/kafka-server-start.sh config/server.properties`
  
### 2. Data Processing Engine (Scala) - connects to Kafka through port 9092
  - Change directory to `packages/tweet-processor`
  - Start the data processor: `sbt run` or the Maven equivalent

### 3. Tweet Streamer (requires NodeJS and Twitter API credentials) - connects to Kafka through port 9092
  - Change directory to `packages/tweet-stream`
  - Install dependencies: `npm install`
  - Start the process with: `node lib/stream.js <consumerKey> <consumerSecret> <accessToken> <tokenSecret> --tags covid-19 coronavirus` or any other tags you want to watch
  
### 4. Analytics API - runs on port 7896 and connects to MongoDB at `127.0.0.1:27017`
  - Change directory to `packages/analytics-api`
  - Install dependencies: `npm install`
  - Run the server: `npm start`
  
### 5. Analytics Front-end - Data Visualisation - runs on port 1234 by default but it will try another port if 1234 is in use
  - Change directory to `packages/analytics-front-end`
  - Install dependencies: `npm install`
  - Run the application: `npm start`
