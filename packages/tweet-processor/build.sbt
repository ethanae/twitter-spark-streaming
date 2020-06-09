name := "tweet-stream-processor"
version := "1.0"
scalaVersion := "2.11.8"

libraryDependencies ++= Seq(
  "org.apache.spark" % "spark-streaming-kafka-0-10_2.11" % "2.4.5",
  "org.apache.spark" % "spark-streaming_2.11" % "2.2.0",
  "org.apache.spark" % "spark-sql_2.11" % "2.2.0",
  "org.mongodb.spark" % "mongo-spark-connector_2.11" % "2.4.1"
)
