import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.{ Seconds, StreamingContext }
import org.apache.spark.{ SparkConf, SparkContext }
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.streaming.kafka010._
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferBrokers
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe

object TweetStreamProcessor {
  def main(args: Array[String]) {
    
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> "localhost:9092",
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "tweet-stream",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean)
    )
    val topics = Array("tweets")

    val sparkConfig = new SparkConf()
      .setAppName("Twitter Stream")
      .setMaster("local[2]")
    val sparkContext = new SparkContext(sparkConfig)
    sparkContext.setLogLevel("ERROR")
    
    val streamingContext = new StreamingContext(sparkContext, Seconds(1))
    val stream = KafkaUtils.createDirectStream[String, String](
      streamingContext,
      PreferBrokers,
      Subscribe[String, String](topics, kafkaParams)
    )
    stream.print()
    val mappedTweets = stream.map(record => (record.key, record.value))
    mappedTweets.print()

    streamingContext.start()
    streamingContext.awaitTermination()
  }
}