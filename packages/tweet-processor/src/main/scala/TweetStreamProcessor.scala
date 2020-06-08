import org.apache.spark.sql.SparkSession
import org.apache.spark.streaming.dstream.DStream
import org.apache.spark.streaming.StreamingContext._
import org.apache.spark.streaming.{ Seconds, StreamingContext }
import org.apache.kafka.clients.consumer.ConsumerRecord
import org.apache.kafka.common.serialization.StringDeserializer
import org.apache.spark.streaming.kafka010._
import org.apache.spark.streaming.kafka010.LocationStrategies.PreferBrokers
import org.apache.spark.streaming.kafka010.ConsumerStrategies.Subscribe
import org.apache.spark.sql.types.{ StructType, StringType, StructField, DateType }

object TweetStreamProcessor {
  def main(args: Array[String]) {
    val kafkaParams = Map[String, Object](
      "bootstrap.servers" -> "localhost:9092",
      "key.deserializer" -> classOf[StringDeserializer],
      "value.deserializer" -> classOf[StringDeserializer],
      "group.id" -> "tweet-stream",
      "auto.offset.reset" -> "latest",
      "enable.auto.commit" -> (false: java.lang.Boolean),
      "fetch.message.max.bytes" -> (2097152: java.lang.Integer)
    )

    val topics = Array("tweets")
    val spark = SparkSession
      .builder()
      .master("local[2]")
      .appName("Twitter Stream Processor")
      .getOrCreate()

    spark.sparkContext.setLogLevel("ERROR")

    val ssc = new StreamingContext(spark.sparkContext, Seconds(2))
    val stream = KafkaUtils.createDirectStream[String, String](
      ssc,
      PreferBrokers,
      Subscribe[String, String](topics, kafkaParams)
    )

    val schema = StructType(
      Array(
        StructField("created_at", StringType, false),
        StructField("text", StringType, false),
        StructField("user", StructType(Array(StructField("location", StringType, true))), false)
      )
    )

    stream.foreachRDD(rddRaw => {
      val rdd = rddRaw.map(_.value.toString)
      val df = spark.read.schema(schema).json(rdd)
      df.createOrReplaceTempView("tweets")
      val data = df.select("text")
      data.show
    })

    ssc.start()
    ssc.awaitTermination()
  }
}